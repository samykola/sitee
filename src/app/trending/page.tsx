import { prisma } from '@/lib/prisma';
import { PostCard } from '@/components/post/PostCard';

export const dynamic = 'force-dynamic';

export default async function TrendingPage() {
  const [hot, week, discussed, saved] = await Promise.all([
    prisma.post.findMany({ orderBy: { likesCount: 'desc' }, take: 6, include: { author: { include: { profile: true } }, media: true } }),
    prisma.post.findMany({ orderBy: { viewsCount: 'desc' }, take: 6, include: { author: { include: { profile: true } }, media: true } }),
    prisma.post.findMany({ orderBy: { commentsCount: 'desc' }, take: 6, include: { author: { include: { profile: true } }, media: true } }),
    prisma.post.findMany({ orderBy: { savesCount: 'desc' }, take: 6, include: { author: { include: { profile: true } }, media: true } }),
  ]);

  const sections = [
    { title: "What's Hot", posts: hot },
    { title: 'Trending This Week', posts: week },
    { title: 'Most Discussed', posts: discussed },
    { title: 'Most Saved', posts: saved },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Trending</h1>
      {sections.map(s => (
        <section key={s.title}>
          <h2 className="text-sm font-semibold mb-3 text-neutral-400 uppercase tracking-wider">{s.title}</h2>
          <div className="space-y-3">
            {s.posts.map(p => (
              <PostCard key={p.id} post={{ ...p, createdAt: p.createdAt.toISOString() } as any} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
