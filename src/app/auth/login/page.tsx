'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('nova@cliprooom.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) { setError((await res.json()).error || 'Login failed'); return; }
    router.push('/'); router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-3 card p-6 mt-10">
      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
      <p className="text-sm text-neutral-500 text-center">
        No account? <Link href="/auth/register" className="text-accent">Register</Link>
      </p>
    </form>
  );
}
