'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send, ArrowLeft, Loader2, Users, Check, X, Share2, Copy, Mic,
  Smile, LogOut, Square, Play, Pause,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/lib/toast';
import { VoiceRecorder } from './VoiceRecorder';
import { GifPicker } from './GifPicker';

type MessageType = 'text' | 'voice' | 'gif';

type Message = {
  id: string;
  type: MessageType;
  content: string;
  mediaUrl: string | null;
  thumbUrl: string | null;
  duration: number | null;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    profile: { avatarUrl: string | null; displayName: string | null } | null;
  };
};

type OtherUser = {
  id: string;
  username: string;
  profile: { avatarUrl: string | null; displayName: string | null } | null;
};

type Participant = {
  userId: string;
  username: string;
  role: string;
  profile: { avatarUrl: string | null; displayName: string | null } | null;
};

export function ChatWindow(props: {
  conversation: {
    id: string;
    isGroup: boolean;
    name: string | null;
    avatarUrl: string | null;
    status: string;
    initiatorId: string | null;
    ownerId: string | null;
    inviteCode: string | null;
  };
  currentUserId: string;
  otherUser: OtherUser | null;
  participants: Participant[];
  initialMessages: Message[];
  isInitiator: boolean;
  isAccepted: boolean;
  isPending: boolean;
}) {
  const {
    conversation, currentUserId, otherUser, participants,
    initialMessages, isInitiator, isAccepted, isPending,
  } = props;
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(initialMessages[initialMessages.length - 1]?.id ?? null);

  // Mark read
  useEffect(() => {
    fetch('/api/conversations/' + conversation.id + '/read', { method: 'POST' }).catch(() => {});
  }, [conversation.id]);

  // Load invite link for groups
  useEffect(() => {
    if (conversation.isGroup) {
      fetch('/api/conversations/' + conversation.id + '/invite')
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.url && setInviteUrl(d.url))
        .catch(() => {});
    }
  }, [conversation.id, conversation.isGroup]);

  // Poll for new messages
  useEffect(() => {
    if (!isAccepted) return;
    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch('/api/conversations/' + conversation.id);
        if (res.ok) {
          const data = await res.json();
          const msgs: Message[] = data.messages || [];
          const newLast = msgs[msgs.length - 1]?.id ?? null;
          if (newLast !== lastIdRef.current) {
            setMessages(msgs);
            lastIdRef.current = newLast;
            fetch('/api/conversations/' + conversation.id + '/read', { method: 'POST' }).catch(() => {});
          }
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversation.id, isAccepted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function sendMessage(payload: {
    type: MessageType;
    content?: string;
    mediaUrl?: string;
    thumbUrl?: string;
    duration?: number;
  }) {
    setSending(true);
    try {
      const res = await fetch('/api/conversations/' + conversation.id + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        lastIdRef.current = data.message.id;
        return true;
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error || 'Failed to send', 'error');
        return false;
      }
    } catch {
      toast('Network error', 'error');
      return false;
    } finally {
      setSending(false);
    }
  }

  async function sendText() {
    if (!content.trim() || sending) return;
    const text = content.trim();
    setContent('');
    const ok = await sendMessage({ type: 'text', content: text });
    if (!ok) setContent(text);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch('/api/conversations/' + conversation.id + '/accept', { method: 'POST' });
      if (res.ok) {
        toast('Chat accepted', 'success');
        router.refresh();
      } else {
        toast('Failed', 'error');
      }
    } finally { setAccepting(false); }
  }

  async function reject() {
    setRejecting(true);
    try {
      const res = await fetch('/api/conversations/' + conversation.id + '/reject', { method: 'POST' });
      if (res.ok) {
        toast('Request declined', 'success');
        router.push('/messages');
        router.refresh();
      } else {
        toast('Failed', 'error');
      }
    } finally { setRejecting(false); }
  }

  async function shareInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast('Invite link copied', 'success');
    } catch {
      toast('Copy failed — link: ' + inviteUrl, 'info');
    }
  }

  async function leaveGroup() {
    if (!confirm('Leave this group?')) return;
    const res = await fetch('/api/conversations/' + conversation.id + '/leave', { method: 'POST' });
    if (res.ok) {
      toast('Left group', 'success');
      router.push('/messages');
      router.refresh();
    }
  }

  // ── Header title ─────────────────────────────────
  const headerTitle = conversation.isGroup
    ? conversation.name || 'Group'
    : otherUser?.profile?.displayName || otherUser?.username || 'Chat';
  const headerSub = conversation.isGroup
    ? participants.length + ' member' + (participants.length !== 1 ? 's' : '')
    : '@' + otherUser?.username;
  const headerAvatar = conversation.isGroup ? conversation.avatarUrl : otherUser?.profile?.avatarUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[#242424]">
        <Link href="/messages" className="btn-ghost p-1.5 md:hidden" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#222] flex items-center justify-center flex-shrink-0">
          {headerAvatar ? (
            <img src={headerAvatar} alt="" className="w-full h-full object-cover" />
          ) : conversation.isGroup ? (
            <Users className="w-4 h-4 text-neutral-500" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{headerTitle}</div>
          <div className="text-xs text-neutral-500 truncate">{headerSub}</div>
        </div>
        {conversation.isGroup && (
          <button onClick={shareInvite} className="btn-ghost p-2" title="Copy invite link" aria-label="Share invite">
            <Share2 className="w-4 h-4" />
          </button>
        )}
        {conversation.isGroup && conversation.ownerId !== currentUserId && (
          <button onClick={leaveGroup} className="btn-ghost p-2 text-red-400" title="Leave group" aria-label="Leave">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pending incoming banner */}
      {isPending && !isInitiator && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="text-sm font-medium mb-2">
            @{otherUser?.username} wants to chat with you
          </div>
          <div className="flex gap-2">
            <button onClick={accept} disabled={accepting} className="btn-primary text-sm flex-1">
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Accept
            </button>
            <button onClick={reject} disabled={rejecting} className="btn-ghost text-sm flex-1 text-red-400">
              {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Waiting banner for initiator */}
      {isPending && isInitiator && (
        <div className="p-3 bg-yellow-500/10 border-b border-yellow-500/20 text-center text-xs text-yellow-400">
          Waiting for @{otherUser?.username} to accept your chat request…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isPending && messages.length === 0 && (
          <div className="text-center text-sm text-neutral-500 py-8">
            {conversation.isGroup ? 'No messages yet. Say hi!' : 'Start the conversation!'}
          </div>
        )}

        {messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            isMine={m.authorId === currentUserId}
            showAuthor={conversation.isGroup && m.authorId !== currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {isAccepted && (
        <div className="border-t border-[#242424]">
          {showVoice ? (
            <VoiceRecorder
              onCancel={() => setShowVoice(false)}
              onSend={async (blob, duration) => {
                const url = await uploadVoice(blob);
                if (!url) { toast('Upload failed', 'error'); return; }
                const ok = await sendMessage({ type: 'voice', mediaUrl: url, duration });
                if (ok) setShowVoice(false);
              }}
            />
          ) : showGif ? (
            <GifPicker
              onClose={() => setShowGif(false)}
              onPick={async (gif) => {
                const ok = await sendMessage({ type: 'gif', mediaUrl: gif.url, thumbUrl: gif.url });
                if (ok) setShowGif(false);
              }}
            />
          ) : (
            <div className="p-3 flex gap-2 items-end">
              <button
                onClick={() => setShowGif(true)}
                disabled={sending}
                className="btn-ghost p-2 flex-shrink-0"
                aria-label="Send GIF"
              >
                <Smile className="w-5 h-5" />
              </button>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="input flex-1 resize-none max-h-32"
              />
              {content.trim() ? (
                <button onClick={sendText} disabled={sending} className="btn-primary px-4 h-10 flex-shrink-0" aria-label="Send">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              ) : (
                <button onClick={() => setShowVoice(true)} disabled={sending} className="btn-primary px-4 h-10 flex-shrink-0" aria-label="Record voice">
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
  showAuthor,
}: {
  message: Message;
  isMine: boolean;
  showAuthor: boolean;
}) {
  return (
    <div className={'flex gap-2 ' + (isMine ? 'flex-row-reverse' : '')}>
      <img
        src={message.author.profile?.avatarUrl || ''}
        alt=""
        className="w-7 h-7 rounded-full bg-[#222] flex-shrink-0"
        loading="lazy"
      />
      <div className={'max-w-[75%] ' + (isMine ? 'text-right' : '')}>
        {showAuthor && (
          <div className="text-[10px] text-neutral-500 mb-0.5">
            {message.author.profile?.displayName || message.author.username}
          </div>
        )}
        <div className={
          'inline-block rounded-2xl overflow-hidden ' +
          (isMine ? 'bg-accent text-white rounded-tr-sm' : 'bg-[#242424] text-neutral-200 rounded-tl-sm')
        }>
          {message.type === 'voice' && message.mediaUrl ? (
            <VoiceBubble url={message.mediaUrl} duration={message.duration || 0} isMine={isMine} />
          ) : message.type === 'gif' && message.mediaUrl ? (
            <img src={message.mediaUrl} alt="GIF" className="max-w-[240px] max-h-[240px] object-cover" loading="lazy" />
          ) : (
            <div className="px-3 py-2 text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>
        <div className="text-[10px] text-neutral-500 mt-1" suppressHydrationWarning>
          {timeAgo(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function VoiceBubble({ url, duration, isMine }: { url: string; duration: number; isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 min-w-[140px]">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={e => setCurrent((e.target as HTMLAudioElement).currentTime)}
      />
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className={'h-full ' + (isMine ? 'bg-white' : 'bg-accent')}
            style={{ width: duration > 0 ? ((current / duration) * 100) + '%' : '0%' }}
          />
        </div>
        <div className="text-[10px] mt-1 opacity-80">
          {Math.floor(duration)}s
        </div>
      </div>
    </div>
  );
}

function uploadVoice(blob: Blob): Promise<string | null> {
  return new Promise(resolve => {
    const fd = new FormData();
    const ext = blob.type.includes('ogg') ? '.ogg' : '.webm';
    fd.append('file', new File([blob], 'voice-' + Date.now() + ext, { type: blob.type }));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.files?.[0]?.url || null);
        } catch { resolve(null); }
      } else { resolve(null); }
    };
    xhr.onerror = () => resolve(null);
    xhr.send(fd);
  });
}
