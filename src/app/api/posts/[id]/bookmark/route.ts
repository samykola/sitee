import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId: me.id, postId: params.id } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: params.id }, data: { savesCount: { decrement: 1 } } });
    return NextResponse.json({ saved: false });
  }
  await prisma.bookmark.create({ data: { userId: me.id, postId: params.id } });
  await prisma.post.update({ where: { id: params.id }, data: { savesCount: { increment: 1 } } });
  return NextResponse.json({ saved: true });
}
