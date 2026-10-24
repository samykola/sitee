import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ count: 0 });
  const count = await prisma.notification.count({
    where: { userId: me.id, isRead: false },
  });
  return NextResponse.json({ count });
}
