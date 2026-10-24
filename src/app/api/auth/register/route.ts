import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import crypto from 'crypto';

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = schema.parse(await req.json());
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return NextResponse.json({ error: 'Email or username taken' }, { status: 409 });

    const avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username;

    const user = await prisma.user.create({
      data: {
        email, username,
        passwordHash: await hashPassword(password),
        profile: { create: { displayName: username, avatarUrl } },
        xp: { create: {} },
      },
    });

    // Auto-create personal channel
    const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      await prisma.channel.create({
        data: {
          ownerId: user.id,
          slug,
          name: username + ' Channel',
          description: 'Personal channel of ' + username,
          avatarUrl,
          bannerUrl: 'https://picsum.photos/1200/300?random=' + slug,
        },
      });
    } catch { /* slug collision, skip */ }

    // Generate email verification link
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken, emailVerifyExpires: verifyExpires },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = appUrl + '/auth/verify-email?token=' + verifyToken;
    console.log('\n✉️  Email verification for ' + email + ':');
    console.log('   ' + verifyUrl + '\n');

    const token = await signToken({ userId: user.id });
    setAuthCookie(token);
    return NextResponse.json({
      ok: true,
      devVerifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
