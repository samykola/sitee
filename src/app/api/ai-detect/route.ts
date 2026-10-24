import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectAIImage } from '@/lib/ai-detect';

export async function POST(req: NextRequest) {
  try {
    const { mediaId } = await req.json();
    if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 });

    const media = await prisma.postMedia.findUnique({ where: { id: mediaId } });
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only run on image types
    if (!media.mimeType.startsWith('image/')) {
      return NextResponse.json({ skipped: true });
    }

    // Fetch the file from /public/uploads
    const fs = await import('fs/promises');
    const path = await import('path');
    const filename = media.url.replace(/^\/uploads\//, '');
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const result = await detectAIImage(buffer);

    await prisma.postMedia.update({
      where: { id: mediaId },
      data: {
        aiGenerated: result.aiGenerated,
        aiConfidence: result.confidence,
      },
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Detection failed' }, { status: 500 });
  }
}
