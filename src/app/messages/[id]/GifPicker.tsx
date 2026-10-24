'use client';
import { useState } from 'react';
import { X, Link2 } from 'lucide-react';

// Curated GIFs (Giphy CDN direct URLs)
const GIFS: { id: string; label: string; url: string }[] = [
  { id: 'thumbsup', label: '👍', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'heart',    label: '❤️', url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif' },
  { id: 'laugh',    label: '😂', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: 'fire',     label: '🔥', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { id: 'wave',     label: '👋', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { id: 'wow',      label: '😮', url: 'https://media.giphy.com/media/26u4cqi6AerHoXq7C/giphy.gif' },
  { id: 'dance',    label: '💃', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'party',    label: '🎉', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
];

export function GifPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (gif: { url: string }) => void;
}) {
  const [url, setUrl] = useState('');

  return (
    <div className="p-3 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Pick a GIF</span>
        <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
        {GIFS.map(g => (
          <button
            key={g.id}
            onClick={() => onPick({ url: g.url })}
            className="aspect-square rounded-lg overflow-hidden bg-[#111] border border-[#242424] hover:border-accent transition relative"
          >
            <img src={g.url} alt={g.label} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-1 right-1 text-xs">{g.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Link2 className="w-4 h-4 text-neutral-500" />
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="input flex-1 text-sm"
          placeholder="Or paste GIF URL…"
        />
        <button
          onClick={() => url.trim() && onPick({ url: url.trim() })}
          disabled={!url.trim()}
          className="btn-primary text-xs px-3"
        >
          Send
        </button>
      </div>
    </div>
  );
}
