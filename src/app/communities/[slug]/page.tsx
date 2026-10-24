import { prisma } from '@/lib/prisma';
import { PostCard } from '@/components/post/PostCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JoinButton } from '@/components/community/JoinButton';
import { getCurrentUser } from '@/lib/auth';
import { prisma as _p } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      posts: { take: 20, orderBy: { createdAt: 'desc' }, include: { author: { include: { profile: true } }, media: true } },
      moderators: { include: { user: { include: { profile: true } } } },
    },
  });
  if (!community) return notFound();
  const me = await getCurrentUser();
  let isMember = false;
  if (me) {
    const m = await prisma.communityMember.findUnique({ where: { userId_communityId: { userId: me.id, communityId: community.id } } }).catch(() => null);
    isMember = !!m;
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="h-40 bg-[#111]"
          style={community.bannerUrl ? { backgroundImage: 'url(' + community.bannerUrl + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
        <div className="p-4 flex gap-4 items-start">
          <img src={community.iconUrl || ''} className="w-16 h-16 rounded-2xl bg-[#222] -mt-10 ring-4 ring-[#161616]" alt="" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{community.name}</h1>
            <p className="text-sm text-neutral-400">{community.description}</p>
            <p className="text-xs text-neutral-500 mt-1">{community.membersCount.toLocaleString()} members</p>
          </div>
          <JoinButton slug={community.slug} initial={isMember} isAuthed={!!me} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          {community.posts.length === 0 ? (
            <div className="card p-10 text-center text-neutral-500">No posts yet.</div>
          ) : community.posts.map(p => (
            <PostCard key={p.id} post={{ ...p, createdAt: p.createdAt.toISOString() } as any} />
          ))}
        </div>
        <aside className="space-y-3">
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-2">Rules</h3>
            <p className="text-xs text-neutral-400 whitespace-pre-line">{community.rules || 'No rules yet.'}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-2">Moderators</h3>
            <div className="space-y-2">
              {community.moderators.length === 0 && <p className="text-xs text-neutral-500">None yet.</p>}
              {community.moderators.map(m => (
                <Link key={m.id} href={'/profile/' + m.user.username}
                  className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white">
                  <img src={m.user.profile?.avatarUrl || ''} className="w-6 h-6 rounded-full bg-[#222]" alt="" />
                  @{m.user.username}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
