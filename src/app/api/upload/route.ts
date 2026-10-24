export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { detectAIImage } from '@/lib/ai-detect';

const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);

let _sharpCache: any | undefined = undefined;
async function getSharp() {
  if (_sharpCache !== undefined) return _sharpCache;
  try { _sharpCache = (await import('sharp')).default; }
  catch { _sharpCache = null; }
  return _sharpCache;
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fd = await req.formData();
  const files = fd.getAll('file') as File[];
  if (!files.length) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const sharp = await getSharp();
  const results: any[] = [];

  for (const file of files) {
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: 'File "' + file.name + '" too large' }, { status: 413 });
    }
    if (!/^(image|video|audio)\//.test(file.type)) {
      return NextResponse.json({ error: 'Invalid type: ' + file.name }, { status: 415 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const name = crypto.randomBytes(12).toString('hex');

    // ── AI detection (on RAW buffer, before processing) ──
    let aiGenerated = false;
    let aiConfidence: number | null = null;
    if (file.type.startsWith('image/') && file.type !== 'image/gif') {
      try {
        const detection = await detectAIImage(buf);
        aiGenerated = detection.aiGenerated;
        aiConfidence = detection.confidence;
        console.log('[upload]', file.name, '→ AI:', aiGenerated, '(' + (aiConfidence * 100).toFixed(1) + '%)', detection.source);
      } catch (e: any) {
        console.error('[upload] detect failed:', e?.message);
      }
    }

    // ── Image optimization with sharp ──
    if (sharp && file.type.startsWith('image/') && file.type !== 'image/gif') {
      try {
        const [original, medium, thumb] = await Promise.all([
          sharp(buf).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
          sharp(buf).rotate().resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
          sharp(buf).rotate().resize(400, 400, { fit: 'cover' }).webp({ quality: 75 }).toBuffer(),
        ]);
        await Promise.all([
          writeFile(path.join(dir, name + '.webp'), original),
          writeFile(path.join(dir, name + '-md.webp'), medium),
          writeFile(path.join(dir, name + '-thumb.webp'), thumb),
        ]);
        const meta = await sharp(buf).metadata();
        results.push({
          url: '/uploads/' + name + '.webp',
          mediumUrl: '/uploads/' + name + '-md.webp',
          thumbUrl: '/uploads/' + name + '-thumb.webp',
          mimeType: 'image/webp',
          width: meta.width, height: meta.height, size: original.length,
          aiGenerated,
          aiConfidence,
        });
        continue;
      } catch { /* fall through */ }
    }

    // ── Raw save (videos, gifs, fallback) ──
    const ext = (path.extname(file.name) || (file.type.startsWith('video') ? '.mp4' : file.type.startsWith('audio') ? '.webm' : '.bin')).toLowerCase();
    const fileName = name + ext;
    await writeFile(path.join(dir, fileName), buf);
    results.push({
      url: '/uploads/' + fileName,
      thumbUrl: null, mediumUrl: null,
      mimeType: file.type, size: buf.length,
      aiGenerated,
      aiConfidence,
    });
  }

  return NextResponse.json({ files: results });
}
