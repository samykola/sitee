import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Check, X } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }: { params: { code: string } }) {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <div className="max-w-md mx-auto card p-8 text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-accent" />
        <h1 className="text-lg font-bold mb-2">Group invite</h1>
        <p className="text-sm text-neutral-400 mb-4">Sign in to join this group.</p>
        <Link href="/auth/login" className="btn-primary w-full">Sign in</Link>
      </div>
    );
  }

  const conv = await prisma.conversation.findUnique({
    where: { inviteCode: params.code },
    include: { participants: true },
  });

  if (!conv || !conv.isGroup) {
    return (
      <div className="max-w-md mx-auto card p-8 text-center">
        <X className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <h1 className="text-lg font-bold mb-2">Invalid invite</h1>
        <p className="text-sm text-neutral-400 mb-4">This invite link is invalid or expired.</p>
        <Link href="/messages" className="btn-ghost w-full">Back to messages</Link>
      </div>
    );
  }

  const isMember = conv.participants.some(p => p.userId === me.id);
  if (!isMember) {
    await prisma.conversationParticipant.create({
      data: { conversationId: conv.id, userId: me.id, role: 'member', status: 'accepted' },
    });
    if (conv.ownerId) {
      await createNotification({
        userId: conv.ownerId,
        actorId: me.id,
        type: 'joined your group "' + (conv.name || 'group') + '"',
        data: { conversationId: conv.id },
      });
    }
  }
  redirect('/messages/' + conv.id);
}
