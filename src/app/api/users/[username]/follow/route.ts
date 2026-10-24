import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardXP, XP_REWARDS } from '@/lib/xp';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function POST(_req: NextRequest, { params }: { params: { username: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const target = await prisma.user.findUnique({ where: { username: params.username } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "Can't follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await prisma.follow.create({ data: { followerId: me.id, followingId: target.id } });
  await createNotification({ userId: target.id, actorId: me.id, type: 'followed you' });
  await awardXP(target.id, XP_REWARDS.receiveFollow);
  await checkAndAwardAchievements(target.id);
  return NextResponse.json({ following: true });
}
