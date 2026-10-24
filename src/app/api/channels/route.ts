import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const mine = searchParams.get('mine') === '1';
  const take = Math.min(parseInt(searchParams.get('take') || '30'), 100);

  if (mine) {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ channels: [] });
    const channels = await prisma.channel.findMany({
      where: { ownerId: me.id },
      orderBy: { createdAt: 'asc' },
      include: { owner: { include: { profile: true } } },
    });
    return NextResponse.json({ channels });
  }

  const channels = await prisma.channel.findMany({
    where: {
      isPublic: true,
      ...(q ? { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    },
    orderBy: { subscribersCount: 'desc' },
    take,
    include: { owner: { include: { profile: true } } },
  });
  return NextResponse.json({ channels });
}

const createSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = createSchema.parse(await req.json());
    const exists = await prisma.channel.findUnique({ where: { slug: data.slug } });
    if (exists) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    const channel = await prisma.channel.create({
      data: { ...data, ownerId: me.id },
    });
    return NextResponse.json({ ok: true, channel });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
