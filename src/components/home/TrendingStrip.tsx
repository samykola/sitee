import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Flame } from 'lucide-react';

export async function TrendingStrip() {
  const tags = await prisma.tag.findMany({
    take: 8,
    where: { postsCount: { gt: 0 } },
    orderBy: [{ postsCount: 'desc' }],
    select: { id: true, slug: true, postsCount: true },
  }).catch(() => []);

  if (tags.length === 0) return null;

  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Trending now
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tags.map((t) => (
          <Link
            key={t.id}
            href={'/tag/' + t.slug}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#111] border border-[#242424] text-xs hover:border-accent transition-colors"
          >
            <span className="text-accent">#{t.slug}</span>
            <span className="ml-1.5 text-neutral-500">{t.postsCount}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
