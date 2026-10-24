'use client';
import { useState } from 'react';
import { Reply } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { renderRichText } from '@/lib/richtext';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; profile?: { avatarUrl?: string; displayName?: string } };
  replies?: Comment[];
};

export function CommentSection({ postId, initialComments }: { postId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/posts/' + postId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId: replyTo?.id || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed');
      }
      const data = await res.json();
      const newComment: Comment = {
        id: data.comment.id,
        content: data.comment.content,
        createdAt: data.comment.createdAt,
        author: { username: 'you', profile: {} },
      };
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo.id
          ? { ...c, replies: [...(c.replies || []), newComment] }
          : c));
      } else {
        setComments(prev => [newComment, ...prev]);
      }
      setContent(''); setReplyTo(null);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-semibold">{comments.length} Comments</h2>
      <div className="space-y-2">
        {replyTo && (
          <div className="text-xs text-neutral-500 flex items-center gap-2">
            Replying to @{replyTo.author.username}
            <button onClick={() => setReplyTo(null)} className="text-red-400">Cancel</button>
          </div>
        )}
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Write a comment…" rows={2} className="input" />
        <button onClick={submit} disabled={loading || !content.trim()} className="btn-primary text-sm">
          {loading ? 'Sending…' : 'Comment'}
        </button>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
      <div className="space-y-3 mt-4">
        {comments.length === 0 && <p className="text-sm text-neutral-500">No comments yet. Be the first!</p>}
        {comments.map(c => (
          <CommentItem key={c.id} comment={c} onReply={setReplyTo} depth={0} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, depth }: { comment: Comment; onReply: (c: Comment) => void; depth: number }) {
  return (
    <div className={depth > 0 ? 'ml-4 sm:ml-6 border-l border-[#242424] pl-3' : ''}>
      <div className="flex gap-2">
        <img src={comment.author?.profile?.avatarUrl || ''} alt="" className="w-7 h-7 rounded-full bg-[#222] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs">
            <b>@{comment.author?.username}</b>
            <span className="text-neutral-500 ml-1" suppressHydrationWarning>{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-neutral-200 mt-1 break-words">{renderRichText(comment.content)}</p>
          <button onClick={() => onReply(comment)}
            className="text-xs text-neutral-500 mt-1 hover:text-white flex items-center gap-1">
            <Reply className="w-3 h-3" /> Reply
          </button>
        </div>
      </div>
      {comment.replies?.map(r => (
        <div key={r.id} className="mt-2">
          <CommentItem comment={r} onReply={onReply} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}
