import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Settings, Radio, Calendar, Award, ShieldCheck, Users } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { FollowButton } from '@/components/profile/FollowButton';
import { MessageButton } from '@/components/profile/MessageButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const me = await getCurrentUser();
  const isSelf = params.username === 'me';
  const username = isSelf ? me?.username : params.username;
  if (!username) return notFound();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      xp: true,
      _count: { select: { posts: true, followers: true, following: true } },
      posts: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { include: { profile: true } },
          media: true,
          channel: true,
        },
      },
      achievements: { include: { achievement: true }, take: 6 },
      channels: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
  });
  if (!user) return notFound();

  const isMyProfile = me?.id === user.id;

  let isFollowing = false;
  if (me && !isMyProfile) {
    const f = await prisma.follow
      .findUnique({
        where: { followerId_followingId: { followerId: me.id, followingId: user.id } },
      })
      .catch(() => null);
    isFollowing = !!f;
  }

  const primaryChannel = user.channels[0] || null;
  const xp = user.xp?.total ?? 0;
  const level = user.xp?.level ?? 1;
  const nextXp = level * 1000;
  const progress = Math.min(100, (xp / nextXp) * 100);
  const joinedAt = user.createdAt.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        {/* Cover */}
        <div
          className="h-28 sm:h-40 md:h-52 bg-[#111] bg-center bg-cover"
          style={
            user.profile?.coverUrl
              ? { backgroundImage: `url(${user.profile.coverUrl})` }
              : undefined
          }
        />

        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-2.5 sm:gap-3 -mt-8 sm:-mt-10">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#222] ring-4 ring-[#161616] flex-shrink-0">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt={user.profile.displayName || user.username}
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
                  {user.profile?.displayName || user.username}
                </h1>
                {primaryChannel?.isVerified && (
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" aria-label="Verified" />
                )}
              </div>
              <p className="text-[11px] sm:text-sm text-neutral-500 truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {user.profile?.bio && (
            <p className="text-sm text-neutral-300 mt-2 sm:mt-3">{user.profile.bio}</p>
          )}

          {/* Meta: Joined + channel link */}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] sm:text-xs text-neutral-400">
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <Calendar className="w-3.5 h-3.5" /> Joined {joinedAt}
            </span>
            {primaryChannel && (
              <span className="flex items-center gap-1 text-neutral-500">
                <Radio className="w-3.5 h-3.5" /> #{primaryChannel.slug}
              </span>
            )}
          </div>

          {/* Stats: Posts / Followers / Following / Subscribers */}
          <div className="flex items-center gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-neutral-400 flex-wrap">
            <span>
              <b className="text-white">{user._count.posts}</b> Posts
            </span>
            <span>
              <b className="text-white">{user._count.followers}</b> Followers
            </span>
            <span>
              <b className="text-white">{user._count.following}</b> Following
            </span>
            {primaryChannel && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <b className="text-white">
                  {primaryChannel.subscribersCount.toLocaleString()}
                </b>{' '}
                <span className="hidden sm:inline">Subscribers</span>
                <span className="sm:hidden">Subs</span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 sm:mt-4 flex gap-2 flex-wrap">
            {isMyProfile ? (
              <>
                <Link href="/settings" className="btn-ghost text-sm flex-1 sm:flex-none">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Link>
                {primaryChannel && (
                  <Link
                    href={'/channels/' + primaryChannel.slug + '/settings'}
                    className="btn-primary text-sm flex-1 sm:flex-none"
                  >
                    <Radio className="w-4 h-4" /> Manage Channel
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 sm:flex-none">
                  <FollowButton
                    username={user.username}
                    initial={isFollowing}
                    isMe={false}
                    isAuthed={!!me}
                  />
                </div>
                {me && (
                  <div className="flex-1 sm:flex-none">
                    <MessageButton userId={user.id} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* XP */}
          <div className="mt-3 sm:mt-4">
            <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
              <span>LEVEL {level}</span>
              <span>
                {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
              </span>
            </div>
            <div className="h-1.5 bg-[#0f0f0f] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-pink-500 transition-all"
                style={{ width: progress + '%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {user.achievements.length > 0 && (
        <div className="card p-3 sm:p-4">
          <h2 className="text-xs font-semibold mb-2 text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Achievements
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {user.achievements.map((a) => (
              <div
                key={a.id}
                className="px-2.5 py-1 rounded-full bg-[#111] border border-[#242424] text-[11px] sm:text-xs"
              >
                {a.achievement.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {user.posts.length === 0 ? (
          <div className="card p-10 text-center text-neutral-500">
            No posts yet.
          </div>
        ) : (
          user.posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={{
                ...p,
                createdAt: p.createdAt.toISOString(),
                author: { ...p.author, id: p.author.id },
                channel: p.channel
                  ? { slug: p.channel.slug, name: p.channel.name }
                  : null,
              } as any}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
