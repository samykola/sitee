import { prisma } from './prisma';
import { createNotification } from './notifications';

export const XP_REWARDS = {
  publishPost: 10,
  receiveLike: 1,
  receiveComment: 2,
  receiveFollow: 5,
  receiveSubscriber: 3,
  dailyLogin: 5,
};

export function calcLevel(total: number): number {
  return Math.floor(Math.sqrt(total / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export async function awardXP(userId: string, amount: number) {
  try {
    const existing = await prisma.userXP.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.userXP.create({
        data: { userId, total: amount, level: calcLevel(amount) },
      });
      return;
    }
    const newTotal = existing.total + amount;
    const newLevel = calcLevel(newTotal);
    await prisma.userXP.update({
      where: { userId },
      data: { total: newTotal, level: newLevel },
    });
    if (newLevel > existing.level) {
      await createNotification({
        userId,
        type: 'reached Level ' + newLevel + '!',
        data: { level: newLevel },
      });
    }
  } catch { /* silent */ }
}
