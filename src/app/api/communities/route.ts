import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  rules: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const exists = await prisma.community.findUnique({ where: { slug: data.slug } });
    if (exists) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });

    const community = await prisma.community.create({
      data: {
        ...data,
        bannerUrl: 'https://picsum.photos/1200/300?random=' + data.slug,
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + data.slug,
        membersCount: 1,
        members: { create: { userId: me.id } },
        moderators: { create: { userId: me.id } },
      },
    });
    return NextResponse.json({ ok: true, community });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
