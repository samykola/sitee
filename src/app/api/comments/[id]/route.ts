import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = comment.authorId === me.id;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(me.role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.comment.delete({ where: { id: params.id } });
  await prisma.post.update({
    where: { id: comment.postId },
    data: { commentsCount: { decrement: 1 } },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
