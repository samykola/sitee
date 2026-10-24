'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export function JoinButton({ slug, initial, isAuthed }: {
  slug: string; initial: boolean; isAuthed: boolean;
}) {
  const [joined, setJoined] = useState(initial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!isAuthed) return <a href="/auth/login" className="btn-primary text-sm">Sign in to Join</a>;

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch('/api/communities/' + slug + '/join', { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setJoined(d.joined);
        toast(d.joined ? 'Joined community' : 'Left community', 'success');
        router.refresh();
      }
    } finally { setLoading(false); }
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={joined ? 'btn-ghost text-sm' : 'btn-primary text-sm'}>
      {loading ? '…' : joined ? 'Joined' : 'Join'}
    </button>
  );
}
