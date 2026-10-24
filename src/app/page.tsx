import { fetchFeed } from '@/lib/feed';
import { getCurrentUser } from '@/lib/auth';
import { Feed } from '@/components/home/Feed';
import { WhoToFollow } from '@/components/home/WhoToFollow';
import { VerifyBanner } from '@/components/home/VerifyBanner';
import { TrendingStrip } from '@/components/home/TrendingStrip';
import { StreakInit } from '@/components/home/StreakInit';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TABS = ['For You', 'Following', 'Latest', 'Trending'] as const;

export default async function HomePage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = (TABS as readonly string[]).includes(searchParams.tab || '')
    ? searchParams.tab!
    : 'For You';

  const me = await getCurrentUser();
  const { posts, nextCursor } = await fetchFeed({
    tab,
    cursor: null,
    take: 20,
    meId: me?.id ?? null,
  });

  return (
    <div className="space-y-4">
      <StreakInit />
      <VerifyBanner />
      <TrendingStrip />

      <div className="card p-1 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t}
            href={'/?tab=' + encodeURIComponent(t)}
            className={
              'px-4 py-2 rounded-lg text-sm transition whitespace-nowrap ' +
              (tab === t ? 'bg-[#242424] text-white' : 'text-neutral-400 hover:text-white')
            }
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === 'For You' && <WhoToFollow />}

      <Feed initialPosts={posts} tab={tab} initialCursor={nextCursor} />
    </div>
  );
}
