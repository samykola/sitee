import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
  if (conv.initiatorId === me.id) return NextResponse.json({ error: 'Only the recipient can reject' }, { status: 400 });

  await prisma.conversation.delete({ where: { id: conv.id } });
  return NextResponse.json({ ok: true });
}
