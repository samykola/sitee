import { prisma } from './prisma';

export const SIGNAL_WEIGHTS = {
  completionRate: 0.35,
  engagementRate: 0.20,
  shareRate: 0.10,
  saveRate: 0.10,
  recency: 0.10,
  affinity: 0.10,
  diversity: 0.05,
};

export const VELOCITY_EXPONENT = 0.7;

function hoursAgo(date: Date | string): number {
  return (Date.now() - new Date(date).getTime()) / 36e5;
}

export type Candidate = {
  id: string;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  repostsCount: number;
  viewsCount: number;
  createdAt: Date;
  tagIds: string[];
  completionRate: number;
  rewatchRate: number;
  skipRate: number;
};

export function scoreCandidate(c: Candidate, ctx: {
  authorAffinity: Map<string, number>;
  tagAffinity: Map<string, number>;
  seenTags: Set<string>;
  followingSet: Set<string>;
}): number {
  const hours = hoursAgo(c.createdAt);

  // Engagement velocity with exponent (TikTok-style)
  const engagements =
    c.likesCount +
    c.commentsCount * 2 +
    c.savesCount * 3 +
    c.sharesCount * 4 +
    c.repostsCount * 4;
  const velocity = engagements / Math.pow(Math.max(hours, 0.1), VELOCITY_EXPONENT);
  const velocityNorm = velocity / (velocity + 50);

  // Rates
  const views = Math.max(c.viewsCount, 1);
  const engagementRate = Math.min(engagements / views, 1);
  const shareRate = Math.min(c.sharesCount / views, 1);
  const saveRate = Math.min(c.savesCount / views, 1);

  // Completion + rewatch (primary TikTok signal)
  const completion = Math.min(c.completionRate + c.rewatchRate * 0.5, 1);
  const skipPenalty = c.skipRate * 0.5;

  // Recency
  const recency = 1 / (1 + hours / 24);

  // Affinity
  const authorAff = Math.min((ctx.authorAffinity.get(c.authorId) ?? 0) / 5, 1);
  const tagAff = Math.min(
    c.tagIds.reduce((sum, id) => sum + (ctx.tagAffinity.get(id) ?? 0), 0) / 10,
    1
  );
  const followingBoost = ctx.followingSet.has(c.authorId) ? 0.15 : 0;

  // Diversity: reward tags the user hasn't interacted with much
  const newTags = c.tagIds.filter((id) => !ctx.seenTags.has(id)).length;
  const diversity = Math.min(newTags / Math.max(c.tagIds.length, 1), 1) * 0.3;

  const score =
    SIGNAL_WEIGHTS.completionRate * completion +
    SIGNAL_WEIGHTS.engagementRate * (engagementRate * 0.6 + velocityNorm * 0.4) +
    SIGNAL_WEIGHTS.shareRate * shareRate +
    SIGNAL_WEIGHTS.saveRate * saveRate +
    SIGNAL_WEIGHTS.recency * recency +
    SIGNAL_WEIGHTS.affinity * (authorAff * 0.5 + tagAff * 0.3 + followingBoost) +
    SIGNAL_WEIGHTS.diversity * diversity -
    skipPenalty;

  return Math.max(score, 0);
}

export async function buildPersonalizedFeed(meId: string, limit = 20) {
  const [impressions, likes, saves, follows, tagInteractions] = await Promise.all([
    prisma.postImpression.findMany({
      where: { userId: meId },
      take: 300,
      orderBy: { createdAt: 'desc' },
      select: { postId: true, watchDuration: true, completed: true, skipped: true },
    }),
    prisma.like.findMany({
      where: { userId: meId },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { authorId: true, tags: { select: { tagId: true } } } } },
    }),
    prisma.bookmark.findMany({
      where: { userId: meId },
      take: 50,
      include: { post: { select: { authorId: true, tags: { select: { tagId: true } } } } },
    }),
    prisma.follow.findMany({ where: { followerId: meId }, select: { followingId: true } }),
    prisma.postImpression.findMany({
      where: { userId: meId },
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { authorId: true, tags: { select: { tagId: true } } } } },
    }),
  ]);

  const authorAffinity = new Map<string, number>();
  const tagAffinity = new Map<string, number>();
  const seenTags = new Set<string>();
  const followingSet = new Set(follows.map((f) => f.followingId));

  for (const l of [...likes, ...saves]) {
    const p = (l as any).post;
    if (!p) continue;
    authorAffinity.set(p.authorId, (authorAffinity.get(p.authorId) ?? 0) + 1);
    for (const t of p.tags) {
      tagAffinity.set(t.tagId, (tagAffinity.get(t.tagId) ?? 0) + 1);
      seenTags.add(t.tagId);
    }
  }
  for (const imp of tagInteractions) {
    const p = (imp as any).post;
    if (!p) continue;
    for (const t of p.tags) seenTags.add(t.tagId);
  }

  // Per-post completion aggregates
  const postIdsWithImpressions = Array.from(new Set(impressions.map((i) => i.postId)));
  const impressionsByPost = new Map<string, { total: number; completed: number; skipped: number }>();
  for (const imp of impressions) {
    const cur = impressionsByPost.get(imp.postId) ?? { total: 0, completed: 0, skipped: 0 };
    cur.total++;
    if (imp.completed) cur.completed++;
    if (imp.skipped) cur.skipped++;
    impressionsByPost.set(imp.postId, cur);
  }

  // Candidate pool: recent + trending + engaged authors
  const candidates = await prisma.post.findMany({
    where: {
      visibility: 'PUBLIC',
      OR: [
        { createdAt: { gte: new Date(Date.now() - 7 * 24 * 36e5) } },
        { isTrending: true },
        { authorId: { in: Array.from(followingSet) } },
      ],
    },
    take: 120,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { include: { profile: true } },
      media: true,
      channel: true,
      tags: { select: { tagId: true } },
      impressions: { take: 100, orderBy: { createdAt: 'desc' } },
    },
  });

  const scored = candidates.map((p) => {
    const imps = p.impressions;
    const total = imps.length || 1;
    const completedCount = imps.filter((i) => i.completed).length;
    const skippedCount = imps.filter((i) => i.skipped).length;
    const rewatchCount = imps.filter((i) => i.watchDuration > 1 && i.completed).length;

    const c: Candidate = {
      id: p.id,
      authorId: p.authorId,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      savesCount: p.savesCount,
      sharesCount: p.sharesCount,
      repostsCount: p.repostsCount,
      viewsCount: p.viewsCount,
      createdAt: p.createdAt,
      tagIds: p.tags.map((t) => t.tagId),
      completionRate: completedCount / total,
      rewatchRate: rewatchCount / total,
      skipRate: skippedCount / total,
    };

    return { post: p, score: scoreCandidate(c, { authorAffinity, tagAffinity, seenTags, followingSet }) };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity injection: every 5th slot, pick a post with new tags
  const result: typeof scored = [];
  const used = new Set<string>();
  let diversitySlot = 0;
  for (const item of scored) {
    if (result.length >= limit) break;
    if (used.has(item.post.id)) continue;
    const isDiversitySlot = diversitySlot % 5 === 4;
    if (isDiversitySlot) {
      const diverse = scored.find(
        (x) => !used.has(x.post.id) && x.post.tags.some((t) => !seenTags.has(t.tagId))
      );
      if (diverse) {
        result.push(diverse);
        used.add(diverse.post.id);
        diversitySlot++;
        continue;
      }
    }
    result.push(item);
    used.add(item.post.id);
    diversitySlot++;
  }

  return result.map((r) => r.post);
}
