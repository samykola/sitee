import { prisma } from './prisma';
import { createNotification } from './notifications';

export function extractMentions(text: string): string[] {
  const re = /(?:^|[^\w])@([a-zA-Z0-9_]{1,30})/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) set.add(m[1]);
  return Array.from(set);
}

export async function notifyMentions(
  text: string,
  actorId: string,
  context: { type: string; data?: Record<string, any> }
) {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;
  const users = await prisma.user.findMany({
    where: { username: { in: usernames }, id: { not: actorId } },
    select: { id: true },
  });
  for (const u of users) {
    await createNotification({
      userId: u.id,
      actorId,
      type: context.type,
      data: context.data,
    });
  }
}
