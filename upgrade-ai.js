// upgrade-ai.js  →  node upgrade-ai.js
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

console.log('\n🧠 Upgrading AI detection to real ViT model...\n');

// ─── 1. package.json ─────────────────────────────────
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Remove fake package
delete pkg.dependencies['@annapurna12/ai-detector'];
for (const dep of Object.keys(pkg.dependencies)) {
  if (dep.startsWith('@contentauth/')) delete pkg.dependencies[dep];
}

// Add real packages
pkg.dependencies['@huggingface/transformers'] = '^4.2.0';
if (!pkg.dependencies['sharp']) pkg.dependencies['sharp'] = '^0.33.5';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('  ✓ package.json updated');

// ─── 2. ai-detect.ts ─────────────────────────────────
const aiPath = path.join(ROOT, 'src', 'lib', 'ai-detect.ts');

const content = `/**
 * AI image detection using a real Vision Transformer (ViT) model.
 *
 * Model: onnx-community/SMOGY-Ai-images-detector-ONNX
 * Accuracy: 98.18% (F1 0.9819) on validation set
 * Runs locally on CPU (ONNX runtime), no external API.
 */

const MODEL_ID = 'onnx-community/SMOGY-Ai-images-detector-ONNX';

// Lazy-loaded pipeline (downloads model on first use, ~300MB, cached after)
let pipelinePromise: Promise<any> | null = null;

async function getPipeline() {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    // Cache models in the project to avoid re-download
    env.cacheDir = './.cache/transformers';
    env.allowRemoteModels = true;

    const pipe = await pipeline('image-classification', MODEL_ID, {
      dtype: 'q8', // quantized int8 — smaller, faster, ~98% of full precision
    });
    return pipe;
  })();
  return pipelinePromise;
}

// ─── Metadata scan (fast, catches C2PA / generator signatures) ──
const AI_SOFTWARE_SIGNATURES: { tag: string; patterns: string[] }[] = [
  { tag: 'DALL-E',           patterns: ['dall-e', 'dalle', 'openai'] },
  { tag: 'Midjourney',       patterns: ['midjourney', 'mj v', '--v 5', '--v 6', '--v 7'] },
  { tag: 'Stable Diffusion', patterns: ['stable diffusion', 'stablediffusion', 'sdxl', 'sd3', 'comfyui', 'automatic1111'] },
  { tag: 'Adobe Firefly',    patterns: ['firefly', 'adobe firefly'] },
  { tag: 'Leonardo AI',      patterns: ['leonardo.ai', 'leonardo ai'] },
  { tag: 'NovelAI',          patterns: ['novelai', 'novel ai'] },
  { tag: 'Google Imagen',    patterns: ['imagen', 'google imagen', 'synthid'] },
  { tag: 'Flux',             patterns: ['flux.1', 'flux 1', 'black forest labs'] },
];

const C2PA_AI_CLAIMS = [
  'trainedalgorithmicmedia',
  'compositewithtrainedalgorithmicmedia',
  'algorithmicmedia',
];

function scanMetadata(buffer: Buffer): { software: string } | null {
  const headSize = Math.min(buffer.length, 64 * 1024);
  const tailSize = Math.min(buffer.length - headSize, 64 * 1024);
  const head = buffer.subarray(0, headSize).toString('latin1').toLowerCase();
  const tail = tailSize > 0
    ? buffer.subarray(buffer.length - tailSize).toString('latin1').toLowerCase()
    : '';
  const text = head + tail;

  for (const claim of C2PA_AI_CLAIMS) {
    if (text.includes(claim)) return { software: 'C2PA (' + claim + ')' };
  }
  for (const sig of AI_SOFTWARE_SIGNATURES) {
    for (const pat of sig.patterns) {
      if (text.includes(pat)) return { software: sig.tag };
    }
  }
  return null;
}

export type AIDetectionResult = {
  aiGenerated: boolean;
  confidence: number;
  source: string;
  software?: string;
};

export async function detectAIImage(buffer: Buffer): Promise<AIDetectionResult> {
  // Layer 1: metadata (instant, very high precision when present)
  const meta = scanMetadata(buffer);
  if (meta) {
    return {
      aiGenerated: true,
      confidence: 0.95,
      source: 'metadata',
      software: meta.software,
    };
  }

  // Layer 2: ViT classifier
  try {
    const pipe = await getPipeline();
    // @huggingface/transformers accepts a Buffer directly for image inputs
    const results = await pipe(buffer);

    if (!Array.isArray(results) || results.length === 0) {
      return { aiGenerated: false, confidence: 0, source: 'ml:empty' };
    }

    // Model returns labels like "AI" / "Real" (or "Fake" / "Real")
    // Find the AI/Fake label
    const aiLabel = results.find((r: any) => {
      const l = String(r.label || '').toLowerCase();
      return l.includes('ai') || l.includes('fake') || l.includes('artificial');
    });

    const aiScore = aiLabel ? Number(aiLabel.score) : 0;

    return {
      aiGenerated: aiScore >= 0.5,
      confidence: aiScore,
      source: 'ml:' + (aiLabel?.label ?? 'unknown'),
    };
  } catch (e: any) {
    // Model download can fail offline — fall back gracefully
    console.error('[ai-detect] ML failed:', e?.message || e);
    return {
      aiGenerated: false,
      confidence: 0,
      source: 'ml:error',
    };
  }
}
`;

fs.writeFileSync(aiPath, content, 'utf8');
console.log('  ✓ src/lib/ai-detect.ts rewritten (SMOGY ViT model)');

// ─── 3. Upload route — maxDuration ───────────────────
const upPath = path.join(ROOT, 'src', 'app', 'api', 'upload', 'route.ts');
if (fs.existsSync(upPath)) {
  let c = fs.readFileSync(upPath, 'utf8');
  if (!c.includes('export const maxDuration')) {
    c = 'export const maxDuration = 60;\nexport const dynamic = \'force-dynamic\';\n\n' + c;
    fs.writeFileSync(upPath, c, 'utf8');
    console.log('  ✓ upload route: maxDuration = 60s');
  }
}

console.log('\n✅ Upgrade complete!\n');
console.log('📋 Next:');
console.log('   npm install');
console.log('   npm run dev');
console.log('   → first upload will download the model (~300MB, one-time)');
console.log('   → subsequent uploads are fast (~200-500ms)');