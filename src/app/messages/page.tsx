import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { timeAgo } from '@/lib/utils';
import { MessageCircle, Users, Inbox, Plus, Check, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'chats',    label: 'Chats',    icon: MessageCircle },
  { key: 'requests', label: 'Requests', icon: Inbox },
  { key: 'groups',   label: 'Groups',   icon: Users },
];

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/login');

  const tab = TABS.find(t => t.key === searchParams.tab)?.key || 'chats';

  const allConvs = await prisma.conversation.findMany({
    where: { participants: { some: { userId: me.id } } },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      participants: { include: { user: { include: { profile: true } } } },
      messages: { 
        orderBy: { createdAt: 'desc' }, 
        take: 1,
        include: { author: { include: { profile: true } } }
      },
    },
  });

  const chats = allConvs.filter(c => !c.isGroup && c.status === 'accepted');
  const requests = allConvs.filter(c => !c.isGroup && c.status === 'pending' && c.initiatorId !== me.id);
  const waiting = allConvs.filter(c => !c.isGroup && c.status === 'pending' && c.initiatorId === me.id);
  const groups = allConvs.filter(c => c.isGroup);

  const requestsCount = requests.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link href="/messages/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New
        </Link>
      </div>

      <div className="card p-1 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = t.key === 'requests' ? requestsCount : 0;
          return (
            <Link
              key={t.key}
              href={'/messages?tab=' + t.key}
              className={
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ' +
                (tab === t.key ? 'bg-[#242424] text-white' : 'text-neutral-400 hover:text-white')
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {tab === 'chats' && (
        <>
          {chats.length === 0 && waiting.length === 0 ? (
            <EmptyState icon={<MessageCircle className="w-10 h-10" />} title="No chats yet" hint="Message someone from their profile to start." />
          ) : (
            <div className="space-y-1">
              {waiting.map(c => {
                const other = c.participants.find(p => p.userId !== me.id)?.user;
                if (!other) return null;
                return (
                  <ConvRow
                    key={c.id}
                    id={c.id}
                    title={other.profile?.displayName || other.username}
                    subtitle={'Waiting for @' + other.username + ' to accept…'}
                    avatarUrl={other.profile?.avatarUrl}
                    timestamp={c.lastMessageAt.toISOString()}
                    pending
                  />
                );
              })}
              {chats.map(c => {
                const other = c.participants.find(p => p.userId !== me.id)?.user;
                if (!other) return null;
                const last = c.messages[0];
                return (
                  <ConvRow
                    key={c.id}
                    id={c.id}
                    title={other.profile?.displayName || other.username}
                    subtitle={last ? previewText(last) : 'No messages yet'}
                    avatarUrl={other.profile?.avatarUrl}
                    timestamp={(last?.createdAt || c.lastMessageAt).toISOString()}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {requests.length === 0 ? (
            <EmptyState icon={<Inbox className="w-10 h-10" />} title="No pending requests" hint="Incoming chat requests will show up here." />
          ) : (
            <div className="space-y-2">
              {requests.map(c => {
                const other = c.participants.find(p => p.userId !== me.id)?.user;
                if (!other) return null;
                return (
                  <div key={c.id} className="card p-3 flex items-center gap-3">
                    <img src={other.profile?.avatarUrl || ''} alt="" className="w-10 h-10 rounded-full bg-[#222]" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{other.profile?.displayName || other.username}</div>
                      <div className="text-xs text-neutral-500">wants to chat with you</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <AcceptButton conversationId={c.id} />
                      <RejectButton conversationId={c.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'groups' && (
        <>
          {groups.length === 0 ? (
            <EmptyState icon={<Users className="w-10 h-10" />} title="No groups" hint="Create a group to chat with multiple people." />
          ) : (
            <div className="space-y-1">
              {groups.map(c => {
                const last = c.messages[0];
                return (
                  <ConvRow
                    key={c.id}
                    id={c.id}
                    title={c.name || 'Group'}
                    subtitle={
                      last
                        ? (last.author.profile?.displayName || last.author.username) + ': ' + previewText(last)
                        : c.participants.length + ' members'
                    }
                    avatarUrl={c.avatarUrl}
                    timestamp={(last?.createdAt || c.lastMessageAt).toISOString()}
                    isGroup
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function previewText(m: any): string {
  if (m.type === 'voice') return '🎤 Voice message';
  if (m.type === 'gif') return '🎬 GIF';
  return m.content || '';
}

function ConvRow(props: {
  id: string;
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  timestamp: string;
  pending?: boolean;
  isGroup?: boolean;
}) {
  return (
    <Link href={'/messages/' + props.id} className="card p-3 flex items-center gap-3 hover:border-[#333] transition">
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#222] flex items-center justify-center">
          {props.avatarUrl ? (
            <img src={props.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : props.isGroup ? (
            <Users className="w-5 h-5 text-neutral-500" />
          ) : null}
        </div>
        {props.isGroup && (
          <span className="absolute -bottom-1 -right-1 bg-[#0a0a0a] border border-[#242424] rounded-full p-0.5">
            <Users className="w-2.5 h-2.5 text-accent" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {props.title}
          {props.pending && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
              PENDING
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500 truncate">{props.subtitle}</div>
      </div>
      <div className="text-xs text-neutral-500 flex-shrink-0" suppressHydrationWarning>
        {timeAgo(props.timestamp)}
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="card p-10 text-center text-neutral-500">
      <div className="flex justify-center mb-3 opacity-50">{icon}</div>
      <p>{title}</p>
      <p className="text-xs mt-2">{hint}</p>
    </div>
  );
}

function AcceptButton({ conversationId }: { conversationId: string }) {
  return (
    <form action={async () => {
      'use server';
      const { prisma } = await import('@/lib/prisma');
      const { getCurrentUser } = await import('@/lib/auth');
      const { createNotification } = await import('@/lib/notifications');
      const me = await getCurrentUser();
      if (!me) return;
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });
      if (!conv || conv.status !== 'pending' || conv.initiatorId === me.id) return;
      await prisma.$transaction([
        prisma.conversation.update({ where: { id: conv.id }, data: { status: 'accepted' } }),
        prisma.conversationParticipant.updateMany({
          where: { conversationId: conv.id, userId: me.id },
          data: { status: 'accepted' },
        }),
      ]);
      if (conv.initiatorId) {
        await createNotification({
          userId: conv.initiatorId,
          actorId: me.id,
          type: 'accepted your chat request',
          data: { conversationId: conv.id },
        });
      }
    }}>
      <button type="submit" className="btn-primary text-xs px-3 py-1.5" title="Accept">
        <Check className="w-3.5 h-3.5" /> Accept
      </button>
    </form>
  );
}

function RejectButton({ conversationId }: { conversationId: string }) {
  return (
    <form action={async () => {
      'use server';
      const { prisma } = await import('@/lib/prisma');
      const { getCurrentUser } = await import('@/lib/auth');
      const me = await getCurrentUser();
      if (!me) return;
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conv || conv.status !== 'pending' || conv.initiatorId === me.id) return;
      await prisma.conversation.delete({ where: { id: conv.id } });
    }}>
      <button type="submit" className="btn-ghost text-xs px-2 py-1.5 text-red-400" title="Decline">
        <X className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
