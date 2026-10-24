import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PostCard } from '@/components/post/PostCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="card p-10 text-center text-neutral-500">
        <Link href="/auth/login" className="text-accent">Sign in</Link> to see your saved posts.
      </div>
    );
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: { author: { include: { profile: true } }, media: true, channel: true },
      },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Saved Posts</h1>
      {bookmarks.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          No saved posts yet. Tap the bookmark icon on any post to save it.
        </div>
      ) : bookmarks.map(b => (
        <PostCard key={b.id} post={{
          ...b.post,
          createdAt: b.post.createdAt.toISOString(),
          author: { ...b.post.author, id: b.post.author.id },
          channel: b.post.channel ? { slug: b.post.channel.slug, name: b.post.channel.name } : null,
          saved: true,
        } as any} />
      ))}
    </div>
  );
}
