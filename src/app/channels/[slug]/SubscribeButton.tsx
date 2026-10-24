'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SubscribeButton({
  slug,
  initial,
  isOwner,
  isAuthed,
}: {
  slug: string;
  initial: boolean;
  isOwner: boolean;
  isAuthed: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (isOwner) return null;
  if (!isAuthed) {
    return (
      <a href="/auth/login" className="btn-primary text-sm w-full sm:w-auto block text-center">
        Sign in to Subscribe
      </a>
    );
  }

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch('/api/channels/' + slug + '/subscribe', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSubscribed(data.subscribed);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={(subscribed ? 'btn-ghost' : 'btn-primary') + ' text-sm w-full sm:w-auto'}
    >
      {loading ? '…' : subscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}
