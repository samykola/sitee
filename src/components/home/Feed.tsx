'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { PostCard } from '@/components/post/PostCard';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { Loader2 } from 'lucide-react';

export function Feed({ initialPosts, tab, initialCursor }: {
  initialPosts: any[];
  tab: string;
  initialCursor: string | null;
}) {
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const res = await fetch(
        '/api/feed?tab=' + encodeURIComponent(tab) + '&cursor=' + encodeURIComponent(cursor)
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => [...prev, ...data.posts]);
        setCursor(data.nextCursor);
        if (!data.nextCursor) setDone(true);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [loading, done, cursor, tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div className="card p-10 text-center text-neutral-500">
        {tab === 'Following'
          ? 'Follow some creators to see their posts here.'
          : 'No posts yet. Be the first to post!'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} index={i} />
      ))}
      <div ref={sentinelRef} />
      {loading && <PostSkeleton />}
      {done && posts.length > 0 && (
        <div className="text-center text-xs text-neutral-600 py-4">You've reached the end.</div>
      )}
    </div>
  );
}
