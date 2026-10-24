'use client';
import Link from 'next/link';
import { Bell, Plus, MessageCircle, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SearchInput } from '@/components/search/SearchInput';
import { Logo } from '@/components/brand/Logo';
import { useMe } from '@/lib/useMe';

export function Navbar() {
  const me = useMe();
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!me) return;
    function fetchCounts() {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetch('/api/notifications/unread-count')
        .then(r => (r.ok ? r.json() : { count: 0 }))
        .then(d => setUnreadNotif(d.count || 0))
        .catch(() => {});
      fetch('/api/messages/unread-count')
        .then(r => (r.ok ? r.json() : { count: 0 }))
        .then(d => setUnreadMsg(d.count || 0))
        .catch(() => {});
    }
    fetchCounts();
    const t = setInterval(fetchCounts, 20000);
    return () => clearInterval(t);
  }, [me]);

  const profileLink = me ? '/profile/' + me.username : '/auth/login';
  const avatarUrl = me?.profile?.avatarUrl;
  const isAdmin = me?.isAdmin || me?.role === 'ADMIN' || me?.role === 'SUPER_ADMIN';

  return (
    <header
      className={
        'fixed top-0 inset-x-0 z-40 transition-colors duration-200 ' +
        (scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur border-b border-[#1a1a1a]' : 'bg-transparent')
      }
    >
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center flex-shrink-0 text-white" aria-label="CLIPROOM home">
          <Logo className="h-7 w-auto hidden sm:block" />
          <Logo className="h-8 w-8 sm:hidden" withText={false} />
        </Link>

        <div className="flex-1 hidden md:flex">
          <SearchInput />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link href="/create" className="btn-primary text-sm hidden sm:inline-flex">
            <Plus className="w-4 h-4" /> Create
          </Link>

          <Link href="/messages" className="btn-ghost p-2 relative" aria-label="Messages">
            <MessageCircle className="w-5 h-5" />
            {unreadMsg > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {unreadMsg > 99 ? '99+' : unreadMsg}
              </span>
            )}
          </Link>

          <Link href="/notifications" className="btn-ghost p-2 relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {unreadNotif > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {unreadNotif > 99 ? '99+' : unreadNotif}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="btn-ghost p-2 hidden sm:inline-flex"
              title="Admin Panel"
              aria-label="Admin Panel"
            >
              <Shield className="w-5 h-5 text-accent" />
            </Link>
          )}

          <Link
            href={profileLink}
            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-accent to-pink-500 ml-1 hover:ring-2 hover:ring-accent/50 transition flex-shrink-0"
            aria-label="Your profile"
            title={me?.profile?.displayName || me?.username || 'Your profile'}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
