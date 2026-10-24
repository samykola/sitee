'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast';

export function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'dm', userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.waiting) {
        toast('Request sent — waiting for approval', 'info');
      }
      router.push('/messages/' + data.id);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost text-sm w-full sm:w-auto"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Message
    </button>
  );
}
