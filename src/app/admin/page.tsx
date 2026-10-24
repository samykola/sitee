import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Flag, Radio, TrendingUp, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(me.role)) redirect('/');

  const [users, posts, comments, communities, channels, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.community.count(),
    prisma.channel.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  const stats = [
    { label: 'Users',        value: users,        href: '/admin/users',    icon: Users,        color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20' },
    { label: 'Posts',        value: posts,        href: '/admin/posts',    icon: FileText,     color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20' },
    { label: 'Comments',     value: comments,     href: '/admin/comments', icon: MessageSquare,color: 'from-green-500/20 to-green-500/5 border-green-500/20' },
    { label: 'Communities',  value: communities,  href: '/communities',    icon: Users,        color: 'from-orange-500/20 to-orange-500/5 border-orange-500/20' },
    { label: 'Channels',     value: channels,     href: '/channels',       icon: Radio,        color: 'from-pink-500/20 to-pink-500/5 border-pink-500/20' },
    { label: 'Pending Reports', value: reports,   href: '/admin/reports',  icon: Flag,         color: 'from-red-500/20 to-red-500/5 border-red-500/20' },
  ];

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { profile: true },
  });

  const recentReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { reporter: { include: { profile: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={'card p-4 bg-gradient-to-br hover:border-[#333] transition ' + s.color}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-70" />
                <ArrowRight className="w-3 h-3 opacity-50" />
              </div>
              <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <Users className="w-4 h-4" /> Recent users
            </h2>
            <Link href="/admin/users" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentUsers.map(u => (
              <Link
                key={u.id}
                href={'/profile/' + u.username}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a]"
              >
                <img
                  src={u.profile?.avatarUrl || ''}
                  alt=""
                  className="w-8 h-8 rounded-full bg-[#222]"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">
                    {u.profile?.displayName || u.username}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">@{u.username}</div>
                </div>
                <span className="text-xs text-neutral-500">{u.role}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <Flag className="w-4 h-4" /> Pending reports
            </h2>
            <Link href="/admin/reports" className="text-xs text-accent hover:underline">
              Review queue
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4">No pending reports. 🎉</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a]">
                  <img
                    src={r.reporter.profile?.avatarUrl || ''}
                    alt=""
                    className="w-6 h-6 rounded-full bg-[#222]"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs">
                      <b>@{r.reporter.username}</b> reported{' '}
                      <span className="text-accent">{r.targetType}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500">{r.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Quick links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href="/admin/users" className="btn-ghost text-sm justify-start">
            <Users className="w-4 h-4" /> Manage Users
          </Link>
          <Link href="/admin/reports" className="btn-ghost text-sm justify-start">
            <Flag className="w-4 h-4" /> Reports Queue
          </Link>
          <Link href="/channels" className="btn-ghost text-sm justify-start">
            <Radio className="w-4 h-4" /> Channels
          </Link>
          <Link href="/communities" className="btn-ghost text-sm justify-start">
            <Users className="w-4 h-4" /> Communities
          </Link>
        </div>
      </div>
    </div>
  );
}
