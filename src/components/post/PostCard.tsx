'use client';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Eye, Trash2, Flag, Copy } from 'lucide-react';
import { formatCount, timeAgo, cn } from '@/lib/utils';
import { renderRichText } from '@/lib/richtext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';
import { useToast } from '@/lib/toast';
import { ReportModal } from '@/components/ui/ReportModal';

export type PostCardData = {
  id: string;
  caption: string | null;
  type: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  savesCount?: number;
  createdAt: string;
  author: { id?: string; username: string; profile?: { avatarUrl?: string | null; displayName?: string | null } | null };
  media: { url: string; mimeType: string; thumbUrl?: string | null; mediumUrl?: string | null; aiGenerated?: boolean; aiConfidence?: number | null }[];
  channel?: { slug: string; name: string } | null;
  liked?: boolean;
  saved?: boolean;
};

export function PostCard({ post, index = 0 }: { post: PostCardData; index?: number }) {
  const me = useMe();
  const router = useRouter();
  const { toast } = useToast();
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likesCount);
  const [saved, setSaved] = useState(!!post.saved);
  const [reposted, setReposted] = useState(!!(post as any).reposted);
  const [reposts, setReposts] = useState<number>((post as any).repostsCount ?? 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = me && post.author.id && me.id === post.author.id;
  const canDelete = isOwner || (me && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(me.role));

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  function triggerLikeAnim() {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 500);
  }

  function triggerSaveAnim() {
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 300);
  }

  async function toggleLike() {
    if (me === null) { toast('Sign in to like', 'info'); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(n => n + (wasLiked ? -1 : 1));
    if (!wasLiked) triggerLikeAnim();
    const res = await fetch('/api/posts/' + post.id + '/like', { method: 'POST' }).catch(() => null);
    if (!res || !res.ok) {
      setLiked(wasLiked);
      setLikes(n => n + (wasLiked ? 1 : -1));
    }
  }

  async function toggleSave() {
    if (me === null) { toast('Sign in to save', 'info'); return; }
    const wasSaved = saved;
    setSaved(!wasSaved);
    triggerSaveAnim();
    const res = await fetch('/api/posts/' + post.id + '/bookmark', { method: 'POST' }).catch(() => null);
    if (res && res.ok) {
      toast(wasSaved ? 'Removed' : 'Saved', 'success');
    } else {
      setSaved(wasSaved);
    }
  }

  async function toggleRepost() {
    if (me === null) { toast('Sign in to repost', 'info'); return; }
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setReposts(n => n + (wasReposted ? -1 : 1));
    const res = await fetch('/api/posts/' + post.id + '/repost', { method: 'POST' }).catch(() => null);
    if (!res || !res.ok) {
      setReposted(wasReposted);
      setReposts(n => n + (wasReposted ? 1 : -1));
    } else {
      toast(wasReposted ? 'Removed repost' : 'Reposted', 'success');
    }
  }

  async function deletePost() {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch('/api/posts/' + post.id, { method: 'DELETE' });
    if (res.ok) { toast('Post deleted', 'success'); router.refresh(); }
    else toast('Delete failed', 'error');
    setMenuOpen(false);
  }

  function copyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin + '/post/' + post.id);
      toast('Link copied', 'success');
    }
    setMenuOpen(false);
  }

  const firstMedia = post.media[0];
  const staggerDelay = Math.min(index * 30, 300);

  return (
    <article
      className="card p-4 transition hover:border-[#333] animate-fade-in-up"
      style={{ animationDelay: staggerDelay + 'ms' }}
    >
      <header className="flex items-center gap-3 mb-3">
        <Link href={'/profile/' + post.author.username}
          className="w-9 h-9 rounded-full overflow-hidden bg-[#222] flex-shrink-0">
          {post.author.profile?.avatarUrl && (
            <img src={post.author.profile.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          )}
        </Link>
        <div className="min-w-0">
          <Link href={'/profile/' + post.author.username}
            className="font-semibold text-sm text-white hover:underline">
            {post.author.profile?.displayName || post.author.username}
          </Link>
          <div className="text-xs text-neutral-500" suppressHydrationWarning>
            @{post.author.username} · {timeAgo(post.createdAt)}
            {post.channel && (
              <> · <Link href={'/channels/' + post.channel.slug} className="text-accent hover:underline">
                #{post.channel.slug}
              </Link></>
            )}
          </div>
        </div>
        <div className="relative ml-auto" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="btn-ghost p-1.5" aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#161616] border border-[#242424] rounded-lg shadow-xl z-20 overflow-hidden animate-scale-in">
              <button onClick={copyLink}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#1f1f1f] flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copy link
              </button>
              {canDelete && (
                <button onClick={deletePost}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
              <button onClick={() => { setReportOpen(true); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#1f1f1f] flex items-center gap-2">
                <Flag className="w-4 h-4" /> Report
              </button>
            </div>
          )}
        </div>
      </header>

      {firstMedia && (
        <Link href={'/post/' + post.id} className="block rounded-xl overflow-hidden mb-3 bg-[#0f0f0f]">
          {firstMedia.mimeType.startsWith('video') ? (
            <video src={firstMedia.url} className="w-full max-h-[520px] object-contain" />
          ) : (
            <img src={firstMedia.mediumUrl || firstMedia.url} alt="" className="w-full max-h-[520px] object-contain" loading="lazy" decoding="async" />
          )}
        </Link>
      )}

      {post.media[0]?.aiGenerated && (
        <div className="mb-2 -mt-1 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-400 tracking-wider">
            AI
          </span>
          {typeof post.media[0].aiConfidence === 'number' && (
            <span className="text-[10px] text-neutral-500">
              {Math.round(post.media[0].aiConfidence * 100)}% confidence
            </span>
          )}
        </div>
      )}

      {post.caption && (
        <p className="text-sm text-neutral-300 mb-3 whitespace-pre-line line-clamp-4">
          {renderRichText(post.caption)}
        </p>
      )}

      <div className="flex items-center gap-1 text-neutral-400 text-xs">
        <button
          onClick={toggleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={cn(
            'btn-ghost px-2 py-1.5 gap-1.5 relative',
            liked && 'text-pink-500'
          )}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              liked && 'fill-pink-500',
              likeAnim && 'animate-heart-burst'
            )}
          />
          <span key={likes} className={cn('inline-block', likeAnim && 'animate-pop')}>
            {formatCount(likes)}
          </span>
        </button>

        <Link href={'/post/' + post.id} className="btn-ghost px-2 py-1.5 gap-1.5" aria-label="Comments">
          <MessageCircle className="w-5 h-5" />
          {formatCount(post.commentsCount)}
        </Link>

        <button className="btn-ghost px-2 py-1.5" aria-label="Share">
          <Send className="w-5 h-5" />
        </button>

        <button
          onClick={toggleSave}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark'}
          className={cn('btn-ghost px-2 py-1.5', saved && 'text-accent')}
        >
          <Bookmark
            className={cn(
              'w-5 h-5',
              saved && 'fill-accent',
              saveAnim && 'animate-pop'
            )}
          />
        </button>

        <span className="ml-auto flex items-center gap-1 text-neutral-500">
          <Eye className="w-4 h-4" /> {formatCount(post.viewsCount)}
        </span>
      </div>

      {reportOpen && (
        <ReportModal targetType="post" targetId={post.id} onClose={() => setReportOpen(false)} />
      )}
    </article>
  );
}
