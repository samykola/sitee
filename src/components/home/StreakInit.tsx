'use client';
import { useEffect } from 'react';

export function StreakInit() {
  useEffect(() => {
    try {
      const key = 'cliprooom_streak_' + new Date().toDateString();
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      fetch('/api/streak/touch', { method: 'POST' }).catch(() => {});
    } catch {
      /* private mode — ignore */
    }
  }, []);
  return null;
}
