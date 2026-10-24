import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardXP } from '@/lib/xp';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.repost.findUnique({
    where: { userId_postId: { userId: me.id, postId: params.id } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: params.id }, data: { repostsCount: { decrement: 1 } } });
    return NextResponse.json({ reposted: false });
  }

  await prisma.repost.create({ data: { userId: me.id, postId: params.id } });
  await prisma.post.update({ where: { id: params.id }, data: { repostsCount: { increment: 1 } } });

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
    if (post && post.authorId !== me.id) {
      await createNotification({
        userId: post.authorId,
        actorId: me.id,
        type: 'reposted your post',
        data: { postId: params.id },
      });
      await awardXP(post.authorId, 2);
    }
  } catch {
    /* silent */
  }

  return NextResponse.json({ reposted: true });
}
