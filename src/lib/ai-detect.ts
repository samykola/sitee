import sharp from 'sharp';

// ─── Metadata scan ─────────────────────────────────────
const AI_SIGNATURES: { tag: string; pats: string[] }[] = [
  { tag: 'DALL-E', pats: ['dall-e', 'dalle', 'openai'] },
  { tag: 'Midjourney', pats: ['midjourney', 'mj v', '--v 5', '--v 6', '--v 7'] },
  { tag: 'Stable Diffusion', pats: ['stable diffusion', 'stablediffusion', 'sdxl', 'sd3', 'comfyui'] },
  { tag: 'Adobe Firefly', pats: ['firefly', 'adobe firefly'] },
  { tag: 'Leonardo AI', pats: ['leonardo.ai', 'leonardo ai'] },
  { tag: 'NovelAI', pats: ['novelai'] },
  { tag: 'Google Imagen', pats: ['imagen', 'synthid'] },
  { tag: 'Flux (BFL)', pats: ['flux.1', 'black forest labs'] },
];
const C2PA_CLAIMS = ['trainedalgorithmicmedia', 'compositewithtrainedalgorithmicmedia'];

function scanMetadata(buffer: Buffer): string | null {
  const head = buffer.subarray(0, Math.min(buffer.length, 128 * 1024)).toString('latin1').toLowerCase();
  const tail = buffer.length > 128 * 1024
    ? buffer.subarray(buffer.length - 128 * 1024).toString('latin1').toLowerCase()
    : '';
  const text = head + tail;
  for (const c of C2PA_CLAIMS) if (text.includes(c)) return 'C2PA: ' + c;
  for (const sig of AI_SIGNATURES) {
    for (const pat of sig.pats) if (text.includes(pat)) return sig.tag;
  }
  return null;
}

// ─── Math ──────────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const high = (v: number, t: number) => clamp(v / t);
const low = (v: number, t: number) => clamp(1 - v / t);

function entropy(hist: Uint32Array, total: number): number {
  if (total <= 0) return 0;
  let H = 0;
  for (let i = 0; i < hist.length; i++) {
    const p = hist[i] / total;
    if (p > 0) H -= p * Math.log2(p);
  }
  return H;
}

function fft(re: Float64Array, im: Float64Array, n: number) {
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe; im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe; im[i + k + len / 2] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        const nIm = curRe * wIm + curIm * wRe;
        curRe = nRe; curIm = nIm;
      }
    }
  }
}

// ─── Types ─────────────────────────────────────────────
export type AIDetectionResult = {
  aiGenerated: boolean;
  confidence: number;   // 0..1
  source: string;       // 'metadata' | 'forensic' | 'none'
  signals: Record<string, number>;
};

// ─── Full forensic analysis ────────────────────────────
async function forensic(buffer: Buffer): Promise<AIDetectionResult> {
  const { data: gray, info } = await sharp(buffer)
    .resize(512, 512, { fit: 'inside' })
    .greyscale()
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, total = w * h;

  const { data: colorRaw, info: cInfo } = await sharp(buffer)
    .resize(w, h, { fit: 'inside' })
    .removeAlpha()
    .toColorspace('srgb')
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });
  const ctotal = cInfo.width * cInfo.height;
  const ch = cInfo.channels;

  const { data: fftBuf } = await sharp(buffer)
    .resize(256, 256, { fit: 'fill' })
    .greyscale()
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });

  // Laplacian
  const lapHist = new Uint32Array(512);
  let lapSum = 0, lapSumSq = 0, lapCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = Math.abs(gray[i - w] + gray[i - 1] - 4 * gray[i] + gray[i + 1] + gray[i + w]);
      lapHist[Math.min(v, 511)]++;
      lapSum += v; lapSumSq += v * v; lapCount++;
    }
  }
  const lapMean = lapSum / Math.max(lapCount, 1);
  const lapStd = Math.sqrt(Math.max(lapSumSq / Math.max(lapCount, 1) - lapMean * lapMean, 0));

  // FFT
  const N = 256;
  const re = new Float64Array(N), im = new Float64Array(N);
  const pwr = new Float64Array(N / 2);
  for (let k = 0; k < N; k++) {
    let s = 0;
    for (let y = 0; y < N; y++) s += fftBuf[y * N + k];
    re[k] = s / N; im[k] = 0;
  }
  fft(re, im, N);
  for (let k = 0; k < N / 2; k++) pwr[k] = re[k] * re[k] + im[k] * im[k];

  const logF: number[] = [], logP: number[] = [];
  for (let k = 1; k < N / 4; k++) {
    logF.push(Math.log10(k));
    logP.push(Math.log10(pwr[k] + 1e-9));
  }
  const mF = logF.reduce((a, b) => a + b, 0) / logF.length;
  const mP = logP.reduce((a, b) => a + b, 0) / logP.length;
  let sn = 0, sd = 0;
  for (let i = 0; i < logF.length; i++) {
    sn += (logF[i] - mF) * (logP[i] - mP);
    sd += (logF[i] - mF) ** 2;
  }
  const slope = sn / sd;

  let lowE = 0, highE = 0;
  for (let k = 1; k < N / 2; k++) {
    if (k < N / 8) lowE += pwr[k];
    else highE += pwr[k];
  }
  const hfRatio = highE / (lowE + highE + 1e-9);

  const lfBins: number[] = [];
  for (let k = 1; k < N / 8; k++) lfBins.push(pwr[k]);
  lfBins.sort((a, b) => a - b);
  const lowMed = lfBins[Math.floor(lfBins.length / 2)] || 1;
  let maxPeak = 0;
  for (let k = 2; k < N / 8 - 2; k++) {
    if (pwr[k] > pwr[k - 1] && pwr[k] > pwr[k - 2] && pwr[k] > pwr[k + 1] && pwr[k] > pwr[k + 2]) {
      if (pwr[k] > maxPeak) maxPeak = pwr[k];
    }
  }
  const peakRatio = Math.min(maxPeak / lowMed, 50);

  // Color stats
  const rH = new Uint32Array(256), gH = new Uint32Array(256), bH = new Uint32Array(256);
  let satSum = 0, satCount = 0;
  for (let i = 0; i < ctotal; i++) {
    let r = 0, g = 0, b = 0;
    if (ch === 3) { r = colorRaw[i*3]; g = colorRaw[i*3+1]; b = colorRaw[i*3+2]; }
    else if (ch === 4) { r = colorRaw[i*4]; g = colorRaw[i*4+1]; b = colorRaw[i*4+2]; }
    else { r = g = b = colorRaw[i] || 0; }
    rH[r]++; gH[g]++; bH[b]++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    if (Number.isFinite(sat)) { satSum += sat; satCount++; }
  }
  const satMean = satCount > 0 ? satSum / satCount : 0;
  const colorEntropyAvg = (entropy(rH, ctotal) + entropy(gH, ctotal) + entropy(bH, ctotal)) / 3;

  // Texture blocks
  const blockVars: number[] = [];
  for (let by = 0; by + 8 <= h; by += 8) {
    for (let bx = 0; bx + 8 <= w; bx += 8) {
      let s = 0, s2 = 0;
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) {
        const v = gray[(by + yy) * w + bx + xx];
        s += v; s2 += v * v;
      }
      const m = s / 64;
      blockVars.push(Math.max(s2 / 64 - m * m, 0));
    }
  }
  const zeroVar = blockVars.length > 0 ? blockVars.filter(v => v < 2).length / blockVars.length : 0;

  // Edges
  let edgePixels = 0;
  const SobelT = 60;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i-w-1] + gray[i-w+1] - 2*gray[i-1] + 2*gray[i+1] - gray[i+w-1] + gray[i+w+1];
      const gy = -gray[i-w-1] - 2*gray[i-w] - gray[i-w+1] + gray[i+w-1] + 2*gray[i+w] + gray[i+w+1];
      if (Math.abs(gx) + Math.abs(gy) > SobelT) edgePixels++;
    }
  }
  const edgeDensity = edgePixels / total;

  // Signals
  const signals: Record<string, number> = {};
  const notes: string[] = [];

  if (lapStd < 4) signals.noiseOverSmooth = low(lapStd, 4);
  else if (lapStd > 45) signals.noiseExcessive = high(lapStd, 45);

  if (hfRatio < 0.005) signals.hfEnergyLow = 1.0;
  else if (hfRatio < 0.05) signals.hfEnergyLow = low(hfRatio, 0.05);
  else if (hfRatio < 0.12) signals.hfEnergyLow = low(hfRatio, 0.12);

  const slopeDev = Math.abs(slope + 2);
  if (slopeDev > 0.5) signals.slopeAnomaly = high(slopeDev, 1.2);
  if (peakRatio > 8) signals.periodicPeak = high(peakRatio, 25);

  if (colorEntropyAvg < 6.5) signals.colorEntropyLow = low(colorEntropyAvg, 6.5);
  if (satMean > 0.55) signals.satTooHigh = high(satMean, 0.55);
  else if (satMean < 0.08) signals.satTooLow = low(satMean, 0.08);

  if (zeroVar > 0.10) signals.smoothBlocks = high(zeroVar, 0.35);
  if (edgeDensity < 0.02) signals.edgeTooFew = low(edgeDensity, 0.02);
  else if (edgeDensity > 0.45) signals.edgeTooMany = high(edgeDensity, 0.55);

  // Compressed-AI composite
  let compressedAI = 0;
  if (hfRatio < 0.005 && zeroVar > 0.08 && peakRatio > 20) {
    signals.viralAI = 1.0;
    compressedAI = 0.9;
  } else if (hfRatio < 0.02 && edgeDensity > 0.28 && zeroVar > 0.08) {
    compressedAI = 0.4;
  }

  // Categories (avg)
  const avg = (keys: string[]) => {
    const vals = keys.map(k => signals[k] || 0).filter(v => Number.isFinite(v));
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };
  const catFinal = {
    noise: avg(['noiseOverSmooth', 'noiseExcessive']),
    freq: avg(['hfEnergyLow', 'slopeAnomaly', 'periodicPeak']),
    color: avg(['colorEntropyLow', 'satTooHigh', 'satTooLow']),
    texture: avg(['smoothBlocks', 'edgeTooFew', 'edgeTooMany']),
  };

  const catWeights = { freq: 0.35, texture: 0.25, noise: 0.20, color: 0.20 };
  let baseScore = 0;
  for (const [k, w] of Object.entries(catWeights)) {
    baseScore += catFinal[k as keyof typeof catFinal] * w;
  }
  baseScore += compressedAI * 0.10;

  // Boost
  const strong = Object.values(signals).filter(v => v >= 0.6).length;
  const veryStrong = Object.values(signals).filter(v => v >= 0.85).length;
  let boost = 0;
  if (veryStrong >= 3 && strong >= 5) boost = 0.35;
  else if (veryStrong >= 2 && strong >= 4) boost = 0.28;
  else if (strong >= 4) boost = 0.18;
  else if (strong === 3) boost = 0.12;
  else if (strong === 2) boost = 0.05;

  const consensus = Object.values(catFinal).filter(v => v > 0.5).length;
  const consensusBoost = consensus >= 4 ? 0.10 : consensus === 3 ? 0.05 : 0;

  // Deduction for real-photo evidence
  const realSignals =
    (lapStd > 8 && lapStd < 40 ? 1 : 0) +
    (satMean > 0.15 && satMean < 0.55 ? 1 : 0) +
    (colorEntropyAvg > 7.0 ? 1 : 0);
  const deduction = realSignals >= 3 ? 0.10 : realSignals === 2 ? 0.05 : 0;

  let finalScore = clamp(baseScore + boost + consensusBoost - deduction);

  // Floor for extreme HF loss
  if (hfRatio < 0.005 && zeroVar > 0.08 && strong >= 2) {
    finalScore = Math.max(finalScore, 0.75);
  }

  return {
    aiGenerated: finalScore >= 0.52,
    confidence: finalScore,
    source: 'forensic',
    signals,
  };
}

// ─── Public API ────────────────────────────────────────
export async function detectAIImage(buffer: Buffer): Promise<AIDetectionResult> {
  // Layer 1: metadata
  const meta = scanMetadata(buffer);
  if (meta) {
    return { aiGenerated: true, confidence: 1.0, source: 'metadata:' + meta, signals: {} };
  }
  // Layer 2: forensic analysis
  try {
    return await forensic(buffer);
  } catch (e: any) {
    console.error('[ai-detect] forensic failed:', e?.message);
    return { aiGenerated: false, confidence: 0, source: 'error', signals: {} };
  }
}
