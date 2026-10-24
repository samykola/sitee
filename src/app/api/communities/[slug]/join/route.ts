import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: me.id, communityId: community.id } },
  });

  if (existing) {
    await prisma.communityMember.delete({ where: { id: existing.id } });
    await prisma.community.update({ where: { id: community.id }, data: { membersCount: { decrement: 1 } } });
    return NextResponse.json({ joined: false });
  }

  await prisma.communityMember.create({ data: { userId: me.id, communityId: community.id } });
  await prisma.community.update({ where: { id: community.id }, data: { membersCount: { increment: 1 } } });
  return NextResponse.json({ joined: true });
}
