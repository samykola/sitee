import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ user: null });

  const primaryChannel = await prisma.channel
    .findFirst({
      where: { ownerId: me.id },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, name: true, avatarUrl: true },
    })
    .catch(() => null);

  return NextResponse.json({
    user: {
      id: me.id,
      username: me.username,
      role: me.role,
      isAdmin: ['ADMIN', 'SUPER_ADMIN'].includes(me.role),
      streakCount: (me as any).streakCount ?? 0,
      longestStreak: (me as any).longestStreak ?? 0,
      profile: me.profile
        ? { displayName: me.profile.displayName, avatarUrl: me.profile.avatarUrl }
        : null,
      primaryChannel,
    },
  });
}
