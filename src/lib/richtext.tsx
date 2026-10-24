import Link from 'next/link';
import type { ReactNode } from 'react';

export function renderRichText(text: string): ReactNode[] {
  const parts = text.split(/(@[a-zA-Z0-9_]{1,30}|#[a-zA-Z0-9_]{1,30})/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      return (
        <Link key={i} href={'/profile/' + part.slice(1)} className="text-accent hover:underline">
          {part}
        </Link>
      );
    }
    if (part.startsWith('#') && part.length > 1) {
      return (
        <Link key={i} href={'/tag/' + part.slice(1).toLowerCase()} className="text-accent hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}
