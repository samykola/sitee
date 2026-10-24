import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me || !['ADMIN', 'SUPER_ADMIN'].includes(me.role)) redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      profile: true,
      _count: { select: { posts: true, followers: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#111] text-xs text-neutral-500">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Posts</th>
                <th className="text-left px-4 py-3">Followers</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-[#1a1a1a]">
                  <td className="px-4 py-2">
                    <Link href={'/profile/' + u.username} className="flex items-center gap-2 hover:underline">
                      <img src={u.profile?.avatarUrl || ''} alt="" className="w-6 h-6 rounded-full bg-[#222]" />
                      <div>
                        <div>{u.profile?.displayName || u.username}</div>
                        <div className="text-xs text-neutral-500">@{u.username}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-neutral-400">{u.role}</td>
                  <td className="px-4 py-2 text-xs text-neutral-400">{u._count.posts}</td>
                  <td className="px-4 py-2 text-xs text-neutral-400">{u._count.followers}</td>
                  <td className="px-4 py-2 text-xs">
                    {u.isBanned ? <span className="text-red-400">Banned</span> : <span className="text-green-400">Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
