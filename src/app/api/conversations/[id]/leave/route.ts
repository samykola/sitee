import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: me.id } } },
    include: { participants: true },
  });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!conv.isGroup) return NextResponse.json({ error: 'Not a group' }, { status: 400 });

  const isOwner = conv.ownerId === me.id;
  const memberCount = conv.participants.length;

  if (isOwner && memberCount <= 1) {
    await prisma.conversation.delete({ where: { id: conv.id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  await prisma.conversationParticipant.deleteMany({
    where: { conversationId: conv.id, userId: me.id },
  });

  // If owner leaves, promote next member
  if (isOwner) {
    const next = conv.participants.find(p => p.userId !== me.id);
    if (next) {
      await prisma.conversation.update({ where: { id: conv.id }, data: { ownerId: next.userId } });
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId: conv.id, userId: next.userId } },
        data: { role: 'owner' },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
