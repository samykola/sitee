import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ streak: 0 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = me.lastActiveDay;
  if (!last) {
    await prisma.user.update({
      where: { id: me.id },
      data: { streakCount: 1, lastActiveDay: today, longestStreak: 1 },
    });
    return NextResponse.json({ streak: 1, longestStreak: 1, isNew: true, isRecord: true });
  }

  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);

  if (lastDay.getTime() === today.getTime()) {
    return NextResponse.json({
      streak: me.streakCount,
      longestStreak: me.longestStreak,
      isNew: false,
    });
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = lastDay.getTime() === yesterday.getTime();
  const newStreak = isConsecutive ? me.streakCount + 1 : 1;
  const longest = Math.max(newStreak, me.longestStreak);

  await prisma.user.update({
    where: { id: me.id },
    data: { streakCount: newStreak, lastActiveDay: today, longestStreak: longest },
  });

  return NextResponse.json({
    streak: newStreak,
    longestStreak: longest,
    isNew: true,
    isRecord: newStreak > me.longestStreak,
  });
}
