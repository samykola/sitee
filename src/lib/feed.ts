import { prisma } from './prisma';
import { buildPersonalizedFeed } from './recommendation';

export type FeedPost = {
  id: string;
  caption: string | null;
  type: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  repostsCount: number;
  createdAt: string;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  author: {
    id: string;
    username: string;
    profile: { avatarUrl: string | null; displayName: string | null } | null;
  };
  media: { url: string; mimeType: string; thumbUrl: string | null; mediumUrl: string | null; aiGenerated?: boolean; aiConfidence?: number | null }[];
  channel: { slug: string; name: string } | null;
};

function shape(post: any, likedSet: Set<string>, savedSet: Set<string>, repostedSet: Set<string>): FeedPost {
  return {
    id: post.id,
    caption: post.caption,
    type: post.type,
    viewsCount: post.viewsCount,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    savesCount: post.savesCount,
    repostsCount: post.repostsCount || 0,
    createdAt: post.createdAt.toISOString(),
    liked: likedSet.has(post.id),
    saved: savedSet.has(post.id),
    reposted: repostedSet.has(post.id),
    author: {
      id: post.author.id,
      username: post.author.username,
      profile: post.author.profile
        ? { avatarUrl: post.author.profile.avatarUrl, displayName: post.author.profile.displayName }
        : null,
    },
    media: post.media.map((m: any) => ({
      aiGenerated: m.aiGenerated,
      aiConfidence: m.aiConfidence,
      url: m.url,
      mimeType: m.mimeType,
      thumbUrl: m.thumbUrl,
      mediumUrl: m.mediumUrl,
    })),
    channel: post.channel ? { slug: post.channel.slug, name: post.channel.name } : null,
  };
}

async function loadUserState(meId: string | null, postIds: string[]) {
  if (!meId || postIds.length === 0) {
    return { likedSet: new Set<string>(), savedSet: new Set<string>(), repostedSet: new Set<string>() };
  }
  const [likes, saves, reposts] = await Promise.all([
    prisma.like.findMany({ where: { userId: meId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.bookmark.findMany({ where: { userId: meId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.repost.findMany({ where: { userId: meId, postId: { in: postIds } }, select: { postId: true } }),
  ]);
  return {
    likedSet: new Set(likes.map((l) => l.postId)),
    savedSet: new Set(saves.map((s) => s.postId)),
    repostedSet: new Set(reposts.map((r) => r.postId)),
  };
}

// Personalized ranking for "For You" tab
async function personalizedForYou(meId: string): Promise<{ posts: FeedPost[]; nextCursor: null }> {
  const posts = await buildPersonalizedFeed(meId, 20);
  const { likedSet, savedSet, repostedSet } = await loadUserState(
    meId,
    posts.map((p) => p.id)
  );
  return { posts: posts.map((p) => shape(p, likedSet, savedSet, repostedSet)), nextCursor: null };
}

export async function fetchFeed(opts: {
  tab: string;
  cursor: string | null;
  take?: number;
  meId?: string | null;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const { tab, cursor, take = 20, meId } = opts;

  // ── Personalized For You ─────────────────────
  if (tab === 'For You' && meId) {
    try {
      return await personalizedForYou(meId);
    } catch {
      // fall through to Latest on error
    }
  }

  const where: any = { visibility: 'PUBLIC' };

  if (tab === 'Following') {
    if (!meId) return { posts: [], nextCursor: null };
    const following = await prisma.follow.findMany({
      where: { followerId: meId },
      select: { followingId: true },
    });
    where.authorId = { in: following.map((f) => f.followingId) };
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: { include: { profile: true } },
      media: true,
      channel: true,
    },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy:
      tab === 'Trending'
        ? [{ likesCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
  });

  const hasMore = posts.length > take;
  const items = hasMore ? posts.slice(0, take) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const { likedSet, savedSet, repostedSet } = await loadUserState(
    meId ?? null,
    items.map((p) => p.id)
  );

  return {
    posts: items.map((p) => shape(p, likedSet, savedSet, repostedSet)),
    nextCursor,
  };
}
