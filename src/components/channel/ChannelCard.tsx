import Link from 'next/link';

export type ChannelCardData = {
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  subscribersCount: number;
  postsCount: number;
  ownerUsername: string;
};

export function ChannelCard({ channel }: { channel: ChannelCardData }) {
  return (
    <Link href={'/channels/' + channel.slug} className="card overflow-hidden hover:border-[#333] transition block">
      <div className="h-20 bg-[#111]"
        style={channel.bannerUrl ? { backgroundImage: 'url(' + channel.bannerUrl + ')', backgroundSize: 'cover' } : undefined} />
      <div className="p-3 flex gap-3">
        <img src={channel.avatarUrl || ''} alt="" className="w-12 h-12 rounded-xl bg-[#222] -mt-8 ring-4 ring-[#161616]" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{channel.name}</div>
          <div className="text-xs text-neutral-500 truncate">@{channel.slug} · @{channel.ownerUsername}</div>
          {channel.description && (
            <div className="text-xs text-neutral-500 line-clamp-2 mt-1">{channel.description}</div>
          )}
          <div className="text-xs text-accent mt-1">
            {channel.subscribersCount.toLocaleString()} subs · {channel.postsCount} posts
          </div>
        </div>
      </div>
    </Link>
  );
}
