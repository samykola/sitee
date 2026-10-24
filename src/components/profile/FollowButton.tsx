'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export function FollowButton({
  username,
  initial,
  isMe,
  isAuthed,
}: {
  username: string;
  initial: boolean;
  isMe: boolean;
  isAuthed: boolean;
}) {
  const [following, setFollowing] = useState(initial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (isMe) return null;
  if (!isAuthed) {
    return (
      <a href="/auth/login" className="btn-primary text-sm w-full sm:w-auto">
        Sign in to Follow
      </a>
    );
  }

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/' + username + '/follow', { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setFollowing(d.following);
        toast(
          d.following ? 'Following @' + username : 'Unfollowed @' + username,
          'success'
        );
        router.refresh();
      } else {
        toast('Failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={(following ? 'btn-ghost' : 'btn-primary') + ' text-sm w-full sm:w-auto'}
    >
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}
