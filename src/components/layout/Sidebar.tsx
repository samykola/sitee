'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Users, TrendingUp, PlusCircle, Bell, User,
  Shield, Radio, Bookmark, UserCheck, MessageCircle, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/lib/useMe';

export function Sidebar() {
  const pathname = usePathname();
  const me = useMe();
  const isAdmin = me?.isAdmin || me?.role === 'ADMIN' || me?.role === 'SUPER_ADMIN';

  const items = [
    { href: '/',              label: 'Home',          icon: Home },
    { href: '/following',     label: 'Following',     icon: UserCheck },
    { href: '/explore',       label: 'Explore',       icon: Compass },
    { href: '/channels',      label: 'Channels',      icon: Radio },
    { href: '/communities',   label: 'Communities',   icon: Users },
    { href: '/trending',      label: 'Trending',      icon: TrendingUp },
    { href: '/bookmarks',     label: 'Bookmarks',     icon: Bookmark },
    { href: '/create',        label: 'Create',        icon: PlusCircle },
    { href: '/messages',      label: 'Messages',      icon: MessageCircle },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile/me',    label: 'Profile',       icon: User },
    { href: '/settings',      label: 'Settings',      icon: Shield },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <nav className="sticky top-20 flex flex-col gap-1">
        {me && (me as any).streakCount > 0 && (
          <div className="card p-3 mb-2 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{(me as any).streakCount} day streak</div>
              <div className="text-[10px] text-neutral-500">Best: {(me as any).longestStreak ?? (me as any).streakCount}</div>
            </div>
          </div>
        )}
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm',
                active ? 'bg-[#161616] text-white' : 'text-neutral-400 hover:bg-[#111] hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" /> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
