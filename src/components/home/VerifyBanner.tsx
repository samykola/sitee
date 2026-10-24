'use client';
import { useEffect, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useToast } from '@/lib/toast';

export function VerifyBanner() {
  const [data, setData] = useState<{ verified: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : { user: null })
      .then(d => {
        if (d.user) setData({ verified: d.user.emailVerified !== false });
      })
      .catch(() => {});
  }, []);

  if (!data || data.verified || dismissed) return null;

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', { method: 'POST' });
      const j = await res.json();
      if (res.ok) {
        toast('Verification link sent! Check server console (dev).', 'success');
        if (j.devVerifyUrl && typeof window !== 'undefined') {
          navigator.clipboard.writeText(j.devVerifyUrl).catch(() => {});
          toast('Dev link copied to clipboard', 'info');
        }
      } else {
        toast(j.error || 'Failed to send', 'error');
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-3 flex items-center gap-3 border-l-4 border-l-yellow-400">
      <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <b>Verify your email</b> to unlock all features.
      </div>
      <button onClick={resend} disabled={loading} className="btn-primary text-xs px-3 py-1.5">
        {loading ? '…' : 'Resend link'}
      </button>
      <button onClick={() => setDismissed(true)} className="text-neutral-500 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
