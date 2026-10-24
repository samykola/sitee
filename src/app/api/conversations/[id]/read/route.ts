import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId: params.id, userId: me.id },
    data: { lastReadAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
