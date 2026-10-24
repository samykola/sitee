import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { awardXP, XP_REWARDS } from '@/lib/xp';

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (channel.ownerId === me.id) return NextResponse.json({ error: "Can't subscribe to your own" }, { status: 400 });

  const existing = await prisma.channelSubscriber.findUnique({
    where: { userId_channelId: { userId: me.id, channelId: channel.id } },
  });

  if (existing) {
    await prisma.channelSubscriber.delete({ where: { id: existing.id } });
    await prisma.channel.update({ where: { id: channel.id }, data: { subscribersCount: { decrement: 1 } } });
    return NextResponse.json({ subscribed: false });
  }

  await prisma.channelSubscriber.create({ data: { userId: me.id, channelId: channel.id } });
  await prisma.channel.update({ where: { id: channel.id }, data: { subscribersCount: { increment: 1 } } });
  await createNotification({
    userId: channel.ownerId,
    actorId: me.id,
    type: 'subscribed to your channel',
    data: { channelSlug: channel.slug },
  });
  await awardXP(channel.ownerId, XP_REWARDS.receiveSubscriber);
  return NextResponse.json({ subscribed: true });
}
