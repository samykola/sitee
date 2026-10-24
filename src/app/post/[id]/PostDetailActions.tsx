'use client';
import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Eye } from 'lucide-react';
import { formatCount } from '@/lib/utils';

export function PostDetailActions({ post }: { post: { id: string; likesCount: number; commentsCount: number; savesCount: number; viewsCount: number; } }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);
  const [saved, setSaved] = useState(false);

  async function toggleLike() {
    setLiked(v => !v); setLikes(n => n + (liked ? -1 : 1));
    await fetch('/api/posts/' + post.id + '/like', { method: 'POST' }).catch(() => {});
  }
  async function toggleSave() {
    setSaved(v => !v);
    await fetch('/api/posts/' + post.id + '/bookmark', { method: 'POST' }).catch(() => {});
  }

  return (
    <div className="flex items-center gap-1 text-neutral-400 text-sm">
      <button onClick={toggleLike} className={'btn-ghost px-2 py-1.5 ' + (liked ? 'text-pink-500' : '')}>
        <Heart className={'w-5 h-5 ' + (liked ? 'fill-pink-500' : '')} /> {formatCount(likes)}
      </button>
      <span className="btn-ghost px-2 py-1.5">
        <MessageCircle className="w-5 h-5" /> {formatCount(post.commentsCount)}
      </span>
      <button className="btn-ghost px-2 py-1.5"><Send className="w-5 h-5" /></button>
      <button onClick={toggleSave} className={'btn-ghost px-2 py-1.5 ' + (saved ? 'text-accent' : '')}>
        <Bookmark className={'w-5 h-5 ' + (saved ? 'fill-accent' : '')} />
      </button>
      <span className="ml-auto flex items-center gap-1 text-neutral-500 text-xs">
        <Eye className="w-4 h-4" /> {formatCount(post.viewsCount)}
      </span>
    </div>
  );
}
