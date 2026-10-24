'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setSent(true);
    if (data.devResetUrl) setDevUrl(data.devResetUrl);
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto card p-6 mt-10 space-y-3">
      <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
      <p className="text-xs text-neutral-500">
        Enter your email. If an account exists, we'll send a reset link.
        In dev, the link is printed to the server console.
      </p>
      {sent && (
        <div className="text-xs bg-[#111] border border-[#242424] rounded-lg p-3 space-y-1">
          <p className="text-green-400">If the email exists, a reset link has been generated.</p>
          <p className="text-neutral-500">Check the server console for the link.</p>
          {devUrl && (
            <a href={devUrl} className="text-accent break-all block hover:underline">
              Open reset link (dev)
            </a>
          )}
        </div>
      )}
      <input type="email" className="input" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)} required />
      <button disabled={loading} className="btn-primary w-full">
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-sm text-neutral-500 text-center">
        <Link href="/auth/login" className="text-accent">Back to login</Link>
      </p>
    </form>
  );
}
