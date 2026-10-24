import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  postId: z.string(),
  watchDuration: z.number().min(0).max(600).default(0),
  completed: z.boolean().default(false),
  skipped: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  try {
    const data = schema.parse(await req.json());
    await prisma.postImpression.create({
      data: {
        postId: data.postId,
        userId: me?.id ?? null,
        watchDuration: Math.round(data.watchDuration),
        completed: data.completed,
        skipped: data.skipped,
      },
    });
    await prisma.post.update({
      where: { id: data.postId },
      data: { viewsCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
