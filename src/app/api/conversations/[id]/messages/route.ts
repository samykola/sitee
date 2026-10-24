import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  type: z.enum(['text', 'voice', 'gif']).default('text'),
  content: z.string().max(2000).optional().default(''),
  mediaUrl: z.string().optional().nullable(),
  thumbUrl: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: me.id } } },
  });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!conv.isGroup && conv.status !== 'accepted') {
    return NextResponse.json({ error: 'Request not accepted yet' }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());

    if (data.type === 'text' && !data.content.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }
    if (data.type !== 'text' && !data.mediaUrl) {
      return NextResponse.json({ error: 'Media URL required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        authorId: me.id,
        type: data.type,
        content: data.content || '',
        mediaUrl: data.mediaUrl || null,
        thumbUrl: data.thumbUrl || null,
        duration: data.duration || null,
      },
      include: { author: { include: { profile: true } } },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ ok: true, message });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
