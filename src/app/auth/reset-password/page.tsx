'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setToken(params.get('token') || ''); }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 chars'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      router.push('/auth/login');
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto card p-6 mt-10 space-y-3">
      <h1 className="text-2xl font-bold mb-2">Set new password</h1>
      {error && <div className="text-sm text-red-400">{error}</div>}
      {!token && <div className="text-xs text-yellow-400">No token in URL. Open the link from your console.</div>}
      <input type="password" className="input" placeholder="New password (min 8)"
        value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
      <input type="password" className="input" placeholder="Confirm password"
        value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
      <button disabled={loading || !token} className="btn-primary w-full">
        {loading ? 'Saving…' : 'Reset password'}
      </button>
      <p className="text-sm text-neutral-500 text-center">
        <Link href="/auth/login" className="text-accent">Back to login</Link>
      </p>
    </form>
  );
}
