'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/',             label: 'Home',   icon: Home },
  { href: '/explore',      label: 'Explore', icon: Compass },
  { href: '/create',       label: 'Create', icon: PlusCircle },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/profile/me',   label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-t border-[#1a1a1a] md:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn('flex flex-col items-center gap-1 text-[10px]',
                active ? 'text-white' : 'text-neutral-500')}>
              <Icon className="w-5 h-5" /> {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
