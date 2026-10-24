'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Users, Loader2, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

export function NewMessageForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<'select' | 'dm' | 'group'>('select');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  async function searchUsers(q: string) {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q) + '&type=users');
      const data = await res.json();
      setResults(data.results || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function startDM(userId: string) {
    setCreating(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'dm', userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push('/messages/' + data.id);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
      setCreating(false);
    }
  }

  async function createGroup() {
    if (groupName.trim().length < 2) {
      toast('Group name must be at least 2 characters', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'group', name: groupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push('/messages/' + data.id);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
      setCreating(false);
    }
  }

  if (mode === 'select') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/messages" className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold">New conversation</h1>
        </div>
        <button onClick={() => setMode('dm')} className="card p-4 flex items-center gap-3 hover:border-accent w-full text-left transition">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-semibold">Direct message</div>
            <div className="text-xs text-neutral-500">Chat privately (needs approval)</div>
          </div>
        </button>
        <button onClick={() => setMode('group')} className="card p-4 flex items-center gap-3 hover:border-accent w-full text-left transition">
          <div className="w-12 h-12 rounded-xl bg-[#1f1f1f] border border-[#333] flex items-center justify-center">
            <Users className="w-6 h-6 text-neutral-300" />
          </div>
          <div>
            <div className="font-semibold">Group</div>
            <div className="text-xs text-neutral-500">Chat with multiple people via invite link</div>
          </div>
        </button>
      </div>
    );
  }

  if (mode === 'group') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('select')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">New group</h1>
        </div>
        <div className="card p-4 space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Group name</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="input mt-1"
              maxLength={60}
              placeholder="My awesome group"
              autoFocus
            />
          </div>
          <p className="text-xs text-neutral-500">
            After creating, you'll get a share link to invite members.
          </p>
          <button onClick={createGroup} disabled={creating} className="btn-primary w-full">
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create group'}
          </button>
        </div>
      </div>
    );
  }

  // DM search
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setMode('select')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Message someone</h1>
      </div>
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }}
            className="input pl-9"
            placeholder="Search by username…"
            autoFocus
          />
        </div>
      </div>
      {loading && <p className="text-xs text-neutral-500 text-center">Searching…</p>}
      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-xs text-neutral-500 text-center">No users found</p>
      )}
      <div className="space-y-1">
        {results.map((u: any) => (
          <button
            key={u.id}
            onClick={() => startDM(u.id)}
            disabled={creating}
            className="card p-3 flex items-center gap-3 hover:border-accent w-full text-left transition disabled:opacity-50"
          >
            <img src={u.profile?.avatarUrl || ''} alt="" className="w-10 h-10 rounded-full bg-[#222]" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{u.profile?.displayName || u.username}</div>
              <div className="text-xs text-neutral-500 truncate">@{u.username}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
