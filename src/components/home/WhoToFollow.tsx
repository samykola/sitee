import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export async function WhoToFollow() {
  const me = await getCurrentUser();
  const excludeIds: string[] = [];
  if (me) {
    excludeIds.push(me.id);
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    });
    excludeIds.push(...follows.map(f => f.followingId));
  }

  const users = await prisma.user.findMany({
    where: { isBanned: false, id: { notIn: excludeIds } },
    take: 4,
    orderBy: { followers: { _count: 'desc' } },
    include: { profile: true, _count: { select: { followers: true } } },
  });

  if (users.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Who to follow</h3>
        <Link href="/explore" className="text-xs text-accent hover:underline">See more</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {users.map((u) => (
          <Link key={u.id} href={'/profile/' + u.username}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a] transition">
            <img src={u.profile?.avatarUrl || ''} alt="" className="w-9 h-9 rounded-full bg-[#222]" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{u.profile?.displayName || u.username}</div>
              <div className="text-xs text-neutral-500 truncate">@{u.username} · {u._count.followers} f</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
