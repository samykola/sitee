'use client';
import { useEffect, useState } from 'react';

export type Me = {
  id: string;
  username: string;
  role: string;
  isAdmin?: boolean;
  streakCount?: number;
  longestStreak?: number;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  primaryChannel?: { slug: string; name: string; avatarUrl: string | null } | null;
} | null;

let cache: Me | undefined = undefined;
let inflight: Promise<Me> | null = null;

async function fetchMe(): Promise<Me> {
  if (!inflight) {
    inflight = fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : { user: null }))
      .then(d => d.user as Me)
      .catch(() => null);
  }
  return inflight;
}

export function useMe(): Me | undefined {
  const [me, setMe] = useState<Me | undefined>(cache);

  useEffect(() => {
    if (cache !== undefined) {
      setMe(cache);
      return;
    }
    fetchMe().then(u => {
      cache = u;
      setMe(u);
    });
  }, []);

  return me;
}

export function clearMeCache() {
  cache = undefined;
  inflight = null;
}
