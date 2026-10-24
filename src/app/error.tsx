'use client';
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[CLIPROOM error]', error);
  }, [error]);

  return (
    <div className="card p-10 text-center max-w-lg mx-auto animate-fade-in">
      <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-neutral-400 mb-6 break-words">
        {error.message || 'An unexpected error occurred.'}
      </p>
      {error.digest && (
        <p className="text-xs text-neutral-500 mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        <Link href="/" className="btn-ghost">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>
    </div>
  );
}
