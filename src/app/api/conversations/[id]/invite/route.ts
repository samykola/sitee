import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: me.id } } },
  });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!conv.isGroup) return NextResponse.json({ error: 'Only groups have invite links' }, { status: 400 });

  let code = conv.inviteCode;
  if (!code) {
    code = crypto.randomBytes(6).toString('hex');
    await prisma.conversation.update({ where: { id: conv.id }, data: { inviteCode: code } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.json({ code, url: appUrl + '/join/' + code });
}
