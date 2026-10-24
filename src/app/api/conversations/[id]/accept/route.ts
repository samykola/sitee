import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { participants: true },
  });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (conv.status !== 'pending') return NextResponse.json({ error: 'Not pending' }, { status: 400 });

  const myPart = conv.participants.find(p => p.userId === me.id);
  if (!myPart) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  if (conv.initiatorId === me.id) return NextResponse.json({ error: 'Only the recipient can accept' }, { status: 400 });

  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conv.id }, data: { status: 'accepted' } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: conv.id, userId: me.id } },
      data: { status: 'accepted' },
    }),
  ]);

  if (conv.initiatorId) {
    await createNotification({
      userId: conv.initiatorId,
      actorId: me.id,
      type: 'accepted your chat request',
      data: { conversationId: conv.id },
    });
  }

  return NextResponse.json({ ok: true });
}
