import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PostCard } from '@/components/post/PostCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FollowingPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="card p-10 text-center text-neutral-500">
        <Link href="/auth/login" className="text-accent">Sign in</Link> to see posts from people you follow.
      </div>
    );
  }

  const following = await prisma.follow.findMany({
    where: { followerId: me.id },
    select: { followingId: true },
  });
  const ids = following.map(f => f.followingId);

  const posts = await prisma.post.findMany({
    where: { authorId: { in: ids }, visibility: { in: ['PUBLIC', 'FOLLOWERS'] } },
    include: { author: { include: { profile: true } }, media: true, channel: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Following</h1>
      {ids.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          You haven't followed anyone yet. <Link href="/explore" className="text-accent">Discover creators</Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          No posts from people you follow yet.
        </div>
      ) : posts.map(p => (
        <PostCard key={p.id} post={{
          ...p,
          createdAt: p.createdAt.toISOString(),
          author: { ...p.author, id: p.author.id },
          channel: p.channel ? { slug: p.channel.slug, name: p.channel.name } : null,
        } as any} />
      ))}
    </div>
  );
}
