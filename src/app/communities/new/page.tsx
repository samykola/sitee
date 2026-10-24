'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function NewCommunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(false);

  function autoSlug(v: string) {
    setName(v);
    if (!slug) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description, rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      toast('Community created', 'success');
      router.push('/communities/' + data.community.slug);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link href="/communities" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <form onSubmit={submit} className="card p-6 space-y-3">
        <h1 className="text-xl font-bold mb-2">Create Community</h1>
        <div>
          <label className="text-xs text-neutral-500">Name</label>
          <input value={name} onChange={e => autoSlug(e.target.value)} className="input mt-1" required minLength={2} maxLength={60} />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="input mt-1" required minLength={2} maxLength={40} />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Rules</label>
          <textarea value={rules} onChange={e => setRules(e.target.value)} rows={4} className="input mt-1"
            placeholder={'1. Be respectful\n2. No spam'} />
        </div>
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating…' : 'Create Community'}
        </button>
      </form>
    </div>
  );
}
