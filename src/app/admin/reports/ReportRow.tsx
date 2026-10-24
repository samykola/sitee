'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';
import { timeAgo } from '@/lib/utils';

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { username: string };
};

export function ReportRow({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function act(action: 'dismiss' | 'delete' | 'resolve') {
    if (action === 'delete' && !confirm('Delete target content/user? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reports/' + report.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast('Action applied', 'success');
        router.refresh();
      } else {
        toast('Action failed', 'error');
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <b>@{report.reporter.username}</b> reported a <b>{report.targetType}</b> — <span className="text-accent">{report.reason}</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1" suppressHydrationWarning>
            {timeAgo(report.createdAt)} · Target ID: <code className="text-neutral-400">{report.targetId.slice(0, 12)}…</code>
          </div>
          {report.details && (
            <p className="text-sm text-neutral-300 mt-2 border-l-2 border-[#242424] pl-2">{report.details}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <button onClick={() => act('dismiss')} disabled={loading} className="btn-ghost text-xs">Dismiss</button>
        <button onClick={() => act('delete')} disabled={loading} className="btn-ghost text-xs text-red-400 hover:text-red-300">Delete target</button>
        <button onClick={() => act('resolve')} disabled={loading} className="btn-primary text-xs">Mark resolved</button>
      </div>
    </div>
  );
}
