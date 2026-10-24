import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: me.id } } },
    include: {
      participants: { include: { user: { include: { profile: true } } } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { author: { include: { profile: true } } },
      },
    },
  });
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(conversation);
}
