'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Results = {
  users: any[];
  channels: any[];
  tags: any[];
};

const EMPTY: Results = { users: [], channels: [], tags: [] };

export function SearchInput() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(EMPTY);
  const debounced = useDebounce(q, 250);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    Promise.all([
      fetch('/api/search?q=' + encodeURIComponent(debounced) + '&type=users', { signal: ctrl.signal }).then(r => r.json()),
      fetch('/api/search?q=' + encodeURIComponent(debounced) + '&type=channels', { signal: ctrl.signal }).then(r => r.json()),
      fetch('/api/search?q=' + encodeURIComponent(debounced) + '&type=tags', { signal: ctrl.signal }).then(r => r.json()),
    ])
      .then(([u, c, t]) => {
        setResults({
          users: (u.results || []).slice(0, 3),
          channels: (c.results || []).slice(0, 3),
          tags: (t.results || []).slice(0, 4),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push('/search?q=' + encodeURIComponent(q.trim()));
      setOpen(false);
    }
  }

  const hasResults = results.users.length + results.channels.length + results.tags.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={submit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#111] border border-[#242424] text-sm focus:border-accent outline-none transition"
            placeholder="Search posts, users, channels…"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); setResults(EMPTY); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {open && q.length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-[#242424] rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto animate-scale-in">
          {loading && (
            <div className="px-4 py-3 text-xs text-neutral-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching…
            </div>
          )}
          {!loading && !hasResults && (
            <div className="px-4 py-3 text-xs text-neutral-500">
              No quick results. Press Enter to search everything.
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 bg-[#111]">Users</div>
              {results.users.map((u: any) => (
                <Link key={u.id} href={'/profile/' + u.username} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[#1f1f1f]">
                  <img src={u.profile?.avatarUrl || ''} alt="" className="w-6 h-6 rounded-full bg-[#222]" loading="lazy" />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{u.profile?.displayName || u.username}</div>
                    <div className="text-xs text-neutral-500">@{u.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.channels.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 bg-[#111]">Channels</div>
              {results.channels.map((c: any) => (
                <Link key={c.id} href={'/channels/' + c.slug} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[#1f1f1f]">
                  <img src={c.avatarUrl || ''} alt="" className="w-6 h-6 rounded-lg bg-[#222]" loading="lazy" />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{c.name}</div>
                    <div className="text-xs text-neutral-500">@{c.slug}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.tags.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 bg-[#111]">Tags</div>
              <div className="flex flex-wrap gap-1 px-4 py-2">
                {results.tags.map((t: any) => (
                  <Link key={t.id} href={'/tag/' + t.slug} onClick={() => setOpen(false)}
                    className="px-2 py-1 text-xs rounded bg-[#111] hover:bg-[#242424]">
                    #{t.slug}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href={'/search?q=' + encodeURIComponent(q)} onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs text-accent border-t border-[#242424] hover:bg-[#1f1f1f]">
            See all results for "{q}" →
          </Link>
        </div>
      )}
    </div>
  );
}
