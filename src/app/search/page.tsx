import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'users', label: 'Users' },
  { key: 'channels', label: 'Channels' },
  { key: 'communities', label: 'Communities' },
  { key: 'tags', label: 'Tags' },
];

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const q = (searchParams.q || '').trim();
  const type = TABS.find(t => t.key === searchParams.type)?.key || 'posts';

  let results: any[] = [];

  if (q) {
    if (type === 'posts') {
      results = await prisma.post.findMany({
        where: { visibility: 'PUBLIC', OR: [
          { caption: { contains: q, mode: 'insensitive' } },
          { tags: { some: { tag: { slug: { contains: q, mode: 'insensitive' } } } } },
        ]},
        take: 40,
        orderBy: { createdAt: 'desc' },
        include: { author: { include: { profile: true } }, media: true, channel: true },
      });
    } else if (type === 'users') {
      results = await prisma.user.findMany({
        where: { OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { profile: { displayName: { contains: q, mode: 'insensitive' } } },
        ]},
        take: 40,
        include: { profile: true, _count: { select: { followers: true, posts: true } } },
      });
    } else if (type === 'channels') {
      results = await prisma.channel.findMany({
        where: { isPublic: true, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ]},
        take: 40,
        include: { owner: { include: { profile: true } } },
      });
    } else if (type === 'communities') {
      results = await prisma.community.findMany({
        where: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]},
        take: 40,
      });
    } else if (type === 'tags') {
      results = await prisma.tag.findMany({
        where: { slug: { contains: q, mode: 'insensitive' } },
        take: 40,
      });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>

      <form className="card p-3" action="/search">
        <input name="q" defaultValue={q} placeholder="Search CLIPROOM…"
          className="input" autoFocus />
        <input type="hidden" name="type" value={type} />
      </form>

      <div className="card p-1 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <Link key={t.key} href={'/search?q=' + encodeURIComponent(q) + '&type=' + t.key}
            className={'px-3 py-2 rounded-lg text-sm transition whitespace-nowrap ' +
              (type === t.key ? 'bg-[#242424] text-white' : 'text-neutral-400 hover:text-white')}>
            {t.label}
          </Link>
        ))}
      </div>

      {!q ? (
        <div className="card p-10 text-center text-neutral-500">Type something to search.</div>
      ) : results.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No results for "{q}".</div>
      ) : type === 'posts' ? (
        <div className="space-y-3">
          {results.map(p => (
            <PostCard key={p.id} post={{
              ...p,
              createdAt: p.createdAt.toISOString(),
              author: { ...p.author, id: p.author.id },
              channel: p.channel ? { slug: p.channel.slug, name: p.channel.name } : null,
            } as any} />
          ))}
        </div>
      ) : type === 'users' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(u => (
            <Link key={u.id} href={'/profile/' + u.username} className="card p-4 flex items-center gap-3 hover:border-[#333]">
              <img src={u.profile?.avatarUrl || ''} alt="" className="w-12 h-12 rounded-full bg-[#222]" />
              <div className="min-w-0">
                <div className="font-medium truncate">{u.profile?.displayName || u.username}</div>
                <div className="text-xs text-neutral-500">@{u.username} · {u._count.followers} followers</div>
              </div>
            </Link>
          ))}
        </div>
      ) : type === 'channels' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(c => (
            <Link key={c.id} href={'/channels/' + c.slug} className="card p-4 hover:border-[#333]">
              <div className="flex items-center gap-3">
                <img src={c.avatarUrl || ''} alt="" className="w-10 h-10 rounded-lg bg-[#222]" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-neutral-500">@{c.slug} · by @{c.owner.username}</div>
                </div>
              </div>
              {c.description && <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{c.description}</p>}
            </Link>
          ))}
        </div>
      ) : type === 'communities' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(c => (
            <Link key={c.id} href={'/communities/' + c.slug} className="card p-4 hover:border-[#333]">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-neutral-500 line-clamp-2">{c.description}</div>
              <div className="text-xs text-accent mt-1">{c.membersCount.toLocaleString()} members</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {results.map(t => (
            <Link key={t.id} href={'/tag/' + t.slug}
              className="px-4 py-2 rounded-full bg-[#161616] border border-[#242424] text-sm hover:border-accent">
              #{t.slug}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
