import { prisma } from '@/lib/prisma';
import { PostCard } from '@/components/post/PostCard';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  if (!tag) return notFound();

  const posts = await prisma.post.findMany({
    where: { visibility: 'PUBLIC', tags: { some: { tagId: tag.id } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { author: { include: { profile: true } }, media: true, channel: true },
  });

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">#{tag.slug}</h1>
        <p className="text-sm text-neutral-500 mt-1">{posts.length} posts</p>
      </div>
      {posts.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No posts with this tag yet.</div>
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
