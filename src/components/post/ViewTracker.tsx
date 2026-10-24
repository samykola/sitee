'use client';
import { useEffect } from 'react';

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      fetch('/api/posts/' + postId + '/view', { method: 'POST' }).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [postId]);
  return null;
}
