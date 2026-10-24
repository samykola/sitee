import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  displayName: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  website: z.string().max(120).optional(),
  location: z.string().max(80).optional(),
});

export async function PUT(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const profile = await prisma.profile.upsert({
      where: { userId: me.id },
      update: data,
      create: { userId: me.id, ...data },
    });
    return NextResponse.json({ ok: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
