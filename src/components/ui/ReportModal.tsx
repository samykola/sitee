'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/lib/toast';

const REASONS = [
  { v: 'SPAM', l: 'Spam' },
  { v: 'HARASSMENT', l: 'Harassment' },
  { v: 'ILLEGAL', l: 'Illegal content' },
  { v: 'COPYRIGHT', l: 'Copyright infringement' },
  { v: 'NSFW', l: 'NSFW / Adult content' },
  { v: 'OTHER', l: 'Other' },
];

export function ReportModal({ targetType, targetId, onClose }: {
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('SPAM');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      if (res.ok) {
        toast('Report submitted — thank you', 'success');
        onClose();
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error || 'Failed to submit report', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Report {targetType}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {REASONS.map(r => (
            <label key={r.v} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="reason" checked={reason === r.v} onChange={() => setReason(r.v)} />
              {r.l}
            </label>
          ))}
        </div>
        <textarea value={details} onChange={e => setDetails(e.target.value)}
          className="input mt-3" rows={3} placeholder="Additional details (optional)" />
        <button onClick={submit} disabled={loading} className="btn-primary w-full mt-3">
          {loading ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  );
}
