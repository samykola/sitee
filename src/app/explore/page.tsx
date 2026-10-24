import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const [trendingPosts, creators, communities, tags] = await Promise.all([
    prisma.post.findMany({ where: { isTrending: true }, include: { author: { include: { profile: true } }, media: true }, take: 12 }),
    prisma.user.findMany({ take: 6, include: { profile: true, _count: { select: { followers: true } } }, orderBy: { followers: { _count: 'desc' } } }),
    prisma.community.findMany({ take: 6, orderBy: { membersCount: 'desc' } }),
    prisma.tag.findMany({ take: 12, orderBy: { postsCount: 'desc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explore</h1>

      <section>
        <h2 className="text-sm font-semibold mb-3 text-neutral-400 uppercase tracking-wider">Popular Creators</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {creators.map(c => (
            <Link key={c.id} href={'/profile/' + c.username} className="card p-4 flex items-center gap-3 hover:border-[#333]">
              <img src={c.profile?.avatarUrl || ''} className="w-10 h-10 rounded-full bg-[#222]" alt="" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{c.profile?.displayName || c.username}</div>
                <div className="text-xs text-neutral-500">{c._count.followers} followers</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3 text-neutral-400 uppercase tracking-wider">Popular Communities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {communities.map(c => (
            <Link key={c.id} href={'/communities/' + c.slug} className="card p-4 hover:border-[#333]">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-neutral-500 line-clamp-2">{c.description}</div>
              <div className="text-xs text-accent mt-1">{c.membersCount.toLocaleString()} members</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3 text-neutral-400 uppercase tracking-wider">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map(t => (
            <Link key={t.id} href={'/tag/' + t.slug}
              className="px-3 py-1.5 rounded-full bg-[#161616] border border-[#242424] text-sm hover:border-accent">
              #{t.slug}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3 text-neutral-400 uppercase tracking-wider">Trending Now</h2>
        <div className="space-y-3">
          {trendingPosts.slice(0, 6).map(p => (
            <PostCard key={p.id} post={{ ...p, createdAt: p.createdAt.toISOString() } as any} />
          ))}
        </div>
      </section>
    </div>
  );
}
