import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ChatWindow } from './ChatWindow';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/login');

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: me.id } } },
    include: {
      participants: { include: { user: { include: { profile: true } } } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { author: { include: { profile: true } } },
      },
    },
  });
  if (!conversation) return notFound();

  const other = conversation.isGroup
    ? null
    : conversation.participants.find(p => p.userId !== me.id)?.user;
  if (!conversation.isGroup && !other) return notFound();

  const isInitiator = conversation.initiatorId === me.id;
  const isAccepted = conversation.isGroup || conversation.status === 'accepted';
  const isPending = !conversation.isGroup && conversation.status === 'pending';

  return (
    <ChatWindow
      conversation={{
        id: conversation.id,
        isGroup: conversation.isGroup,
        name: conversation.name,
        avatarUrl: conversation.avatarUrl,
        status: conversation.status,
        initiatorId: conversation.initiatorId,
        ownerId: conversation.ownerId,
        inviteCode: conversation.inviteCode,
      }}
      currentUserId={me.id}
      otherUser={
        other
          ? {
              id: other.id,
              username: other.username,
              profile: other.profile
                ? { avatarUrl: other.profile.avatarUrl, displayName: other.profile.displayName }
                : null,
            }
          : null
      }
      participants={conversation.participants.map(p => ({
        userId: p.userId,
        username: p.user.username,
        role: p.role,
        profile: p.user.profile
          ? { avatarUrl: p.user.profile.avatarUrl, displayName: p.user.profile.displayName }
          : null,
      }))}
      initialMessages={conversation.messages.map(m => ({
        id: m.id,
        type: m.type as 'text' | 'voice' | 'gif',
        content: m.content,
        mediaUrl: m.mediaUrl,
        thumbUrl: m.thumbUrl,
        duration: m.duration,
        createdAt: m.createdAt.toISOString(),
        authorId: m.authorId,
        author: {
          id: m.author.id,
          username: m.author.username,
          profile: m.author.profile
            ? { avatarUrl: m.author.profile.avatarUrl, displayName: m.author.profile.displayName }
            : null,
        },
      }))}
      isInitiator={isInitiator}
      isAccepted={isAccepted}
      isPending={isPending}
    />
  );
}
