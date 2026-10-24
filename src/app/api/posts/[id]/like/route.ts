import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardXP, XP_REWARDS } from '@/lib/xp';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: me.id, postId: params.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: params.id }, data: { likesCount: { decrement: 1 } } });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { userId: me.id, postId: params.id } });
  await prisma.post.update({ where: { id: params.id }, data: { likesCount: { increment: 1 } } });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post) {
    await createNotification({
      userId: post.authorId,
      actorId: me.id,
      type: 'liked your post',
      data: { postId: params.id },
    });
    await awardXP(post.authorId, XP_REWARDS.receiveLike);
    await checkAndAwardAchievements(post.authorId);
  }
  return NextResponse.json({ liked: true });
}
