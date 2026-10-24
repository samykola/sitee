import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (me.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: me.id },
    data: { emailVerifyToken: token, emailVerifyExpires: expires },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = appUrl + '/auth/verify-email?token=' + token;
  console.log('\n✉️  Verify link for ' + me.email + ':');
  console.log('   ' + verifyUrl + '\n');

  return NextResponse.json({
    ok: true,
    devVerifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
  });
}
