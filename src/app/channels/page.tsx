import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ChannelCard } from '@/components/channel/ChannelCard';

export const dynamic = 'force-dynamic';

export default async function ChannelsPage() {
  const channels = await prisma.channel.findMany({
    where: { isPublic: true },
    orderBy: { subscribersCount: 'desc' },
    take: 50,
    include: { owner: { include: { profile: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Channels</h1>
        <Link href="/channels/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Channel
        </Link>
      </div>
      {channels.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No channels yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map(c => (
            <ChannelCard key={c.id} channel={{
              slug: c.slug, name: c.name, description: c.description,
              avatarUrl: c.avatarUrl, bannerUrl: c.bannerUrl,
              subscribersCount: c.subscribersCount, postsCount: c.postsCount,
              ownerUsername: c.owner.username,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
