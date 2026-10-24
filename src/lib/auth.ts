import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { cache } from 'react';
import { prisma } from './prisma';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-me-please-32-chars-minimum'
);
const COOKIE = 'cliprooom_token';

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signToken(payload: { userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function setAuthCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  cookies().delete(COOKIE);
}

const getUserById = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, xp: true },
  });
});

export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    return getUserById(userId);
  } catch {
    return null;
  }
}
