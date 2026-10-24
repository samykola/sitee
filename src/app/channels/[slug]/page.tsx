import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings, ShieldCheck, Calendar, Users } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { SubscribeButton } from './SubscribeButton';
import { MessageButton } from '@/components/profile/MessageButton';

export const dynamic = 'force-dynamic';

export default async function ChannelPage({ params }: { params: { slug: string } }) {
  const channel = await prisma.channel.findUnique({
    where: { slug: params.slug },
    include: { owner: { include: { profile: true } } },
  });
  if (!channel) return notFound();

  // Personal channels are the same as the user's profile — redirect there.
  const primaryChannel = await prisma.channel.findFirst({
    where: { ownerId: channel.ownerId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (primaryChannel?.id === channel.id) {
    redirect('/profile/' + channel.owner.username);
  }

  const me = await getCurrentUser();
  const isOwner = me?.id === channel.ownerId;
  if (!channel.isPublic && !isOwner) return notFound();

  const posts = await prisma.post.findMany({
    where: { channelId: channel.id, visibility: 'PUBLIC' },
    include: { author: { include: { profile: true } }, media: true, channel: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  let subscribed = false;
  if (me) {
    const sub = await prisma.channelSubscriber.findUnique({
      where: { userId_channelId: { userId: me.id, channelId: channel.id } },
    });
    subscribed = !!sub;
  }

  const memberSince = channel.createdAt.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div
          className="h-28 sm:h-40 md:h-52 bg-[#111] relative bg-center bg-cover"
          style={
            channel.bannerUrl ? { backgroundImage: `url(${channel.bannerUrl})` } : undefined
          }
        >
          {!channel.isPublic && (
            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/70 backdrop-blur text-[10px] sm:text-xs font-medium text-neutral-300 border border-white/10">
              Private
            </span>
          )}
        </div>

        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-end gap-2.5 sm:gap-3 -mt-8 sm:-mt-10">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-[#222] ring-4 ring-[#161616] flex-shrink-0">
              {channel.avatarUrl ? (
                <img
                  src={channel.avatarUrl}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-pink-500" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-0.5 sm:pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold leading-tight truncate">
                  {channel.name}
                </h1>
                {channel.isVerified && (
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" aria-label="Verified" />
                )}
              </div>
              <p className="text-[11px] sm:text-sm text-neutral-500 truncate">
                @{channel.slug} · by{' '}
                <Link href={'/profile/' + channel.owner.username} className="hover:underline">
                  @{channel.owner.username}
                </Link>
              </p>
            </div>
          </div>

          {channel.description && (
            <p className="text-sm text-neutral-300 mt-2 sm:mt-3">{channel.description}</p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap text-[11px] sm:text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <b className="text-white">{channel.subscribersCount.toLocaleString()}</b>
              <span className="hidden sm:inline">subscribers</span>
              <span className="sm:hidden">subs</span>
            </span>
            <span>
              <b className="text-white">{channel.postsCount}</b> posts
            </span>
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <Calendar className="w-3.5 h-3.5" /> Joined {memberSince}
            </span>
          </div>

          <div className="mt-3 sm:mt-4 flex gap-2">
            {isOwner ? (
              <Link
                href={'/channels/' + channel.slug + '/settings'}
                className="btn-ghost text-sm w-full sm:w-auto"
              >
                <Settings className="w-4 h-4" /> Manage Channel
              </Link>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none">
                  <SubscribeButton
                    slug={channel.slug}
                    initial={subscribed}
                    isOwner={false}
                    isAuthed={!!me}
                  />
                </div>
                {me && (
                  <div className="flex-1 sm:flex-none">
                    <MessageButton userId={channel.ownerId} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="card p-10 text-center text-neutral-500">
            No posts yet in this channel.
            {isOwner && (
              <>
                {' '}
                <Link href="/create" className="text-accent hover:underline">
                  Create your first post →
                </Link>
              </>
            )}
          </div>
        ) : (
          posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={{
                ...p,
                createdAt: p.createdAt.toISOString(),
                author: { ...p.author, id: p.author.id },
                channel: p.channel ? { slug: p.channel.slug, name: p.channel.name } : null,
              } as any}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
