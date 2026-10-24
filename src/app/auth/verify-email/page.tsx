import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  let status: 'success' | 'error' = 'error';
  let message = 'No token provided.';

  if (token) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpires: { gt: new Date() } },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
      });
      status = 'success';
      message = 'Your email has been verified! You can now use all CLIPROOM features.';
    } else {
      message = 'This verification link is invalid or has expired.';
    }
  }

  return (
    <div className="max-w-md mx-auto card p-8 mt-10 text-center">
      <div className="text-4xl mb-4">{status === 'success' ? '✓' : '✗'}</div>
      <h1 className="text-xl font-bold mb-2">
        {status === 'success' ? 'Email verified' : 'Verification failed'}
      </h1>
      <p className="text-sm text-neutral-400 mb-6">{message}</p>
      <Link href="/" className="btn-primary w-full">Go to Home</Link>
    </div>
  );
}
