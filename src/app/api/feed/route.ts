import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { fetchFeed } from '@/lib/feed';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'For You';
  const cursor = searchParams.get('cursor');
  const me = await getCurrentUser();
  const result = await fetchFeed({ tab, cursor, meId: me?.id ?? null });
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': me
        ? 'private, max-age=5, stale-while-revalidate=30'
        : 'public, max-age=15, stale-while-revalidate=60',
    },
  });
}
