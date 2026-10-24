import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';

const schema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { currentPassword, newPassword } = schema.parse(await req.json());
    if (!(await verifyPassword(currentPassword, me.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: me.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
