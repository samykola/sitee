import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { email, password } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await signToken({ userId: user.id });
    setAuthCookie(token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
