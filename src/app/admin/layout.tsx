'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Flag, FileText, MessageSquare, Shield } from 'lucide-react';

const tabs = [
  { href: '/admin',           label: 'Overview',     icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Users',        icon: Users },
  { href: '/admin/reports',   label: 'Reports',      icon: Flag },
  { href: '/admin/posts',     label: 'Posts',        icon: FileText },
  { href: '/admin/comments',  label: 'Comments',     icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="card p-1 flex items-center gap-1 overflow-x-auto">
        <span className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 flex-shrink-0">
          <Shield className="w-4 h-4" /> Admin
        </span>
        <div className="w-px h-6 bg-[#242424]" />
        {tabs.map(t => {
          const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition',
                active ? 'bg-[#242424] text-white' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
