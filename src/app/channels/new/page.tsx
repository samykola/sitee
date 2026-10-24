'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewChannelPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function autoSlug(v: string) {
    setName(v);
    if (!slug) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description, isPublic }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Create failed');
      router.push('/channels/' + j.channel.slug);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link href="/channels" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Channels
      </Link>
      <form onSubmit={submit} className="card p-6 space-y-3">
        <h1 className="text-xl font-bold mb-2">Create Channel</h1>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div>
          <label className="text-xs text-neutral-500">Name</label>
          <input value={name} onChange={e => autoSlug(e.target.value)} className="input mt-1" required minLength={2} maxLength={60} />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Slug (URL)</label>
          <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="input mt-1" required minLength={2} maxLength={40}
            placeholder="my-channel" />
          <p className="text-xs text-neutral-600 mt-1">Only a-z, 0-9 and hyphens.</p>
        </div>
        <div>
          <label className="text-xs text-neutral-500">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
          Public channel
        </label>
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating…' : 'Create Channel'}
        </button>
      </form>
    </div>
  );
}
