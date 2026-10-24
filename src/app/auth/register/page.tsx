'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    setLoading(false);
    if (!res.ok) { setError((await res.json()).error || 'Register failed'); return; }
    router.push('/'); router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-3 card p-6 mt-10">
      <h1 className="text-2xl font-bold mb-2">Create account</h1>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <input className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input className="input" type="password" placeholder="Password (min 8)" value={password} onChange={e => setPassword(e.target.value)} required />
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating…' : 'Sign Up'}</button>
      <p className="text-sm text-neutral-500 text-center">
        Have an account? <Link href="/auth/login" className="text-accent">Login</Link>
      </p>
    </form>
  );
}
