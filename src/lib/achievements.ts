import { prisma } from './prisma';
import { awardXP } from './xp';
import { createNotification } from './notifications';

export async function checkAndAwardAchievements(userId: string) {
  try {
    const [user, achievements, earned] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { posts: true, followers: true, comments: true } },
          posts: { select: { likesCount: true } },
          moderations: { select: { id: true } },
        },
      }),
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);
    if (!user) return;

    const earnedIds = new Set(earned.map(e => e.achievementId));
    const totalLikes = user.posts.reduce((s, p) => s + p.likesCount, 0);

    const testers: Record<string, boolean> = {
      'first-post':        user._count.posts >= 1,
      'first-100-likes':   totalLikes >= 100,
      '100-comments':      user._count.comments >= 100,
      '1000-followers':    user._count.followers >= 1000,
      'top-creator':       totalLikes >= 5000 && user._count.followers >= 500,
      'community-founder': user.moderations.length >= 1,
      'trending-creator':  user.posts.some(p => p.likesCount >= 100),
    };

    for (const a of achievements) {
      if (earnedIds.has(a.id)) continue;
      if (!testers[a.slug]) continue;
      await prisma.userAchievement.create({
        data: { userId, achievementId: a.id },
      }).catch(() => {});
      await awardXP(userId, a.xp);
      await createNotification({
        userId,
        type: 'earned achievement: ' + a.name,
        data: { achievementSlug: a.slug, xp: a.xp },
      });
    }
  } catch { /* silent */ }
}
