import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};
  let ok = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'failed';
    ok = false;
  }

  checks.env_jwt = process.env.JWT_SECRET ? 'ok' : 'missing';
  checks.env_app_url = process.env.NEXT_PUBLIC_APP_URL ? 'ok' : 'missing';
  if (!process.env.JWT_SECRET) ok = false;

  return NextResponse.json(
    { status: ok ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  );
}
