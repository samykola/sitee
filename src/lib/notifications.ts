import { prisma } from './prisma';

export async function createNotification(input: {
  userId: string;
  actorId?: string;
  type: string;
  data?: Record<string, any>;
}) {
  if (input.userId === input.actorId) return;
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId,
        type: input.type,
        data: input.data ?? {},
      },
    });
  } catch { /* silent */ }
}
