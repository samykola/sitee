import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { code: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { inviteCode: params.code },
    include: { participants: true },
  });
  if (!conv || !conv.isGroup) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  const existing = conv.participants.find(p => p.userId === me.id);
  if (existing) {
    return NextResponse.json({ id: conv.id, alreadyMember: true });
  }

  await prisma.conversationParticipant.create({
    data: { conversationId: conv.id, userId: me.id, role: 'member', status: 'accepted' },
  });

  if (conv.ownerId) {
    await createNotification({
      userId: conv.ownerId,
      actorId: me.id,
      type: 'joined your group "' + (conv.name || 'group') + '"',
      data: { conversationId: conv.id },
    });
  }

  return NextResponse.json({ id: conv.id, joined: true });
}
