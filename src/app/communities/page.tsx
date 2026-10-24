import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CommunitiesPage() {
  const communities = await prisma.community.findMany({ orderBy: { membersCount: 'desc' } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Communities</h1>
        <span className="btn-ghost text-sm">Create (coming soon)</span>
      </div>
      {communities.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No communities yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {communities.map(c => (
            <Link key={c.id} href={'/communities/' + c.slug} className="card overflow-hidden hover:border-[#333]">
              <div className="h-24 bg-[#111]"
                style={c.bannerUrl ? { backgroundImage: 'url(' + c.bannerUrl + ')', backgroundSize: 'cover' } : undefined} />
              <div className="p-4 flex gap-3">
                <img src={c.iconUrl || ''} className="w-12 h-12 rounded-xl bg-[#222] -mt-8 ring-4 ring-[#161616]" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-neutral-500 line-clamp-2">{c.description}</div>
                  <div className="text-xs text-accent mt-1">{c.membersCount.toLocaleString()} members</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
