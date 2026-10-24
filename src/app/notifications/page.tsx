import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="card p-10 text-center text-neutral-500">
        <Link href="/auth/login" className="text-accent">Sign in</Link> to see notifications.
      </div>
    );
  }
  const items = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { actor: { include: { profile: true } } },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {items.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No notifications yet.</div>
      ) : items.map(n => (
        <div key={n.id} className={'card p-4 flex items-center gap-3 ' + (!n.isRead ? 'border-accent/40' : '')}>
          <img src={n.actor?.profile?.avatarUrl || ''} className="w-9 h-9 rounded-full bg-[#222]" alt="" />
          <div className="flex-1">
            <div className="text-sm"><b>@{n.actor?.username || 'system'}</b> {n.type}</div>
            <div className="text-xs text-neutral-500" suppressHydrationWarning>{timeAgo(n.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
