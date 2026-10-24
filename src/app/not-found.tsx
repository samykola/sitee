import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="card p-12 text-center max-w-lg mx-auto animate-fade-in">
      <div className="text-6xl font-bold text-accent mb-2">404</div>
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-neutral-400 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-2 justify-center">
        <Link href="/" className="btn-primary">
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link href="/explore" className="btn-ghost">
          <Compass className="w-4 h-4" /> Explore
        </Link>
      </div>
    </div>
  );
}
