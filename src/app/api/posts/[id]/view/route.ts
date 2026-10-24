import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || null;

  try {
    await prisma.post.update({ where: { id: params.id }, data: { viewsCount: { increment: 1 } } });
    await prisma.view.create({
      data: { postId: params.id, userId: me?.id, ip },
    });
  } catch { /* silent */ }
  return NextResponse.json({ ok: true });
}
