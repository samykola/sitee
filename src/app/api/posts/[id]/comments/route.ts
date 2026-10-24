import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardXP, XP_REWARDS } from '@/lib/xp';
import { notifyMentions } from '@/lib/mentions';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { postId: params.id, parentId: null },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { include: { profile: true } },
      replies: { include: { author: { include: { profile: true } } } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content, parentId } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

  const c = await prisma.comment.create({
    data: { postId: params.id, authorId: me.id, content: content.trim(), parentId: parentId || null },
  });
  await prisma.post.update({ where: { id: params.id }, data: { commentsCount: { increment: 1 } } });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post) {
    await createNotification({
      userId: post.authorId,
      actorId: me.id,
      type: 'commented on your post',
      data: { postId: params.id, commentId: c.id },
    });
    await awardXP(post.authorId, XP_REWARDS.receiveComment);
    await notifyMentions(content, me.id, { type: 'mentioned you in a comment', data: { postId: params.id, commentId: c.id } });
    await checkAndAwardAchievements(post.authorId);
  }

  return NextResponse.json({ ok: true, comment: c });
}
