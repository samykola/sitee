import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json());
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
    });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
