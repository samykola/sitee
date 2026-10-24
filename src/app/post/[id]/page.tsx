import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CommentSection } from '@/components/post/CommentSection';
import { PostDetailActions } from './PostDetailActions';
import { timeAgo } from '@/lib/utils';
import { ViewTracker } from '@/components/post/ViewTracker';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: { include: { profile: true } },
      media: true,
      channel: true,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
        include: {
          author: { include: { profile: true } },
          replies: {
            include: { author: { include: { profile: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });
  if (!post) return notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <ViewTracker postId={post.id} />
      <article className="card overflow-hidden">
        <header className="p-4 flex items-center gap-3">
          <Link href={'/profile/' + post.author.username}>
            <img src={post.author.profile?.avatarUrl || ''} alt="" className="w-10 h-10 rounded-full bg-[#222]" />
          </Link>
          <div className="min-w-0">
            <Link href={'/profile/' + post.author.username} className="font-semibold text-white hover:underline">
              {post.author.profile?.displayName || post.author.username}
            </Link>
            <div className="text-xs text-neutral-500" suppressHydrationWarning>
              @{post.author.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
          {post.channel && (
            <Link href={'/channels/' + post.channel.slug} className="ml-auto text-xs text-accent">
              #{post.channel.slug}
            </Link>
          )}
        </header>

        {post.media.length > 0 && (
          <div className={post.media.length === 1 ? '' : 'grid grid-cols-2 gap-1'}>
            {post.media.map(m => (
              <div key={m.id} className="bg-[#0f0f0f]">
                {m.mimeType.startsWith('video') ? (
                  <video src={m.url} controls className="w-full max-h-[600px] object-contain" />
                ) : (
                  <img src={m.url} alt="" className="w-full max-h-[600px] object-contain" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-4">
          {post.caption && (
            <p className="text-sm text-neutral-200 whitespace-pre-line mb-3">{post.caption}</p>
          )}
          <PostDetailActions post={{
            id: post.id,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            savesCount: post.savesCount,
            viewsCount: post.viewsCount,
          }} />
        </div>
      </article>

      <CommentSection
        postId={post.id}
        initialComments={post.comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
          author: {
            username: c.author.username,
            profile: { avatarUrl: c.author.profile?.avatarUrl || undefined, displayName: c.author.profile?.displayName || undefined },
          },
          replies: c.replies.map(r => ({
            id: r.id,
            content: r.content,
            createdAt: r.createdAt.toISOString(),
            author: {
              username: r.author.username,
              profile: { avatarUrl: r.author.profile?.avatarUrl || undefined, displayName: r.author.profile?.displayName || undefined },
            },
          })),
        }))}
      />
    </div>
  );
}
