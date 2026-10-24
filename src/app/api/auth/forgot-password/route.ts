import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true }); // silent to prevent enumeration

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = appUrl + '/auth/reset-password?token=' + token;
    console.log('\n🔑 Password reset link for ' + email + ':');
    console.log('   ' + resetUrl + '\n');

    return NextResponse.json({
      ok: true,
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
