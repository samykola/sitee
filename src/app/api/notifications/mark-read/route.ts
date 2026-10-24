import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.notification.updateMany({
    where: { userId: me.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
