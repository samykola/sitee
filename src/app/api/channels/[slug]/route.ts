import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const channel = await prisma.channel.findUnique({
    where: { slug: params.slug },
    include: {
      owner: { include: { profile: true } },
      _count: { select: { subscribers: true, posts: true } },
    },
  });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ channel });
}

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (channel.ownerId !== me.id) {
    return NextResponse.json({ error: 'Only the owner can edit this channel' }, { status: 403 });
  }

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data,
    });
    return NextResponse.json({ ok: true, channel: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (channel.ownerId !== me.id) {
    return NextResponse.json({ error: 'Only the owner can delete this channel' }, { status: 403 });
  }

  await prisma.channel.delete({ where: { id: channel.id } });
  return NextResponse.json({ ok: true });
}
