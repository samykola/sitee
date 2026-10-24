import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import crypto from 'crypto';

export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: me.id } } },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        participants: { include: { user: { include: { profile: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return NextResponse.json({ conversations });
  } catch (e) {
    console.error('[GET /api/conversations] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const createSchema = z.object({
  mode: z.enum(['dm', 'group']).optional(),
  userId: z.string().optional(),
  name: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let raw;
  try {
    raw = await req.json();
  } catch {
    console.error('[POST /api/conversations] invalid JSON');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[POST /api/conversations] validation failed:', parsed.error.flatten());
    return NextResponse.json({
      error: 'Invalid request body',
      detail: parsed.error.flatten(),
    }, { status: 400 });
  }

  const data = parsed.data;
  const mode = data.mode || (data.userId ? 'dm' : null);
  if (!mode) {
    return NextResponse.json({ error: 'Missing mode or userId' }, { status: 400 });
  }

  try {
    if (mode === 'dm') {
      if (!data.userId) return NextResponse.json({ error: 'userId required for DM' }, { status: 400 });

      const target = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (target.id === me.id) return NextResponse.json({ error: "Can't message yourself" }, { status: 400 });

      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: me.id } } },
            { participants: { some: { userId: target.id } } },
          ],
        },
        include: { participants: true },
      });

      if (existing) {
        const myPart = existing.participants.find(p => p.userId === me.id);
        return NextResponse.json({
          id: existing.id,
          status: existing.status,
          waiting: existing.status === 'pending' && existing.initiatorId === me.id,
          incoming: existing.status === 'pending' && existing.initiatorId === target.id,
          role: myPart ? myPart.role : null,
        });
      }

      const conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          status: 'pending',
          initiatorId: me.id,
          participants: {
            create: [
              { userId: me.id, role: 'member', status: 'accepted' },
              { userId: target.id, role: 'member', status: 'pending' },
            ],
          },
        },
      });

      try {
        await createNotification({
          userId: target.id,
          actorId: me.id,
          type: 'wants to chat with you',
          data: { conversationId: conversation.id },
        });
      } catch (nErr) {
        console.error('[notification] failed:', nErr);
      }

      return NextResponse.json({
        id: conversation.id,
        status: 'pending',
        waiting: true,
        incoming: false,
      });
    }

    if (mode === 'group') {
      if (!data.name || data.name.length < 2) {
        return NextResponse.json({ error: 'Group name required (min 2 chars)' }, { status: 400 });
      }

      const inviteCode = crypto.randomBytes(6).toString('hex');
      const conversation = await prisma.conversation.create({
        data: {
          isGroup: true,
          name: data.name,
          avatarUrl: data.avatarUrl || null,
          ownerId: me.id,
          status: 'accepted',
          inviteCode,
          participants: {
            create: [{ userId: me.id, role: 'owner', status: 'accepted' }],
          },
        },
      });
      return NextResponse.json({ id: conversation.id, inviteCode });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (e: any) {
    console.error('[POST /api/conversations] Prisma/runtime error:');
    console.error('  message:', e?.message);
    console.error('  code:   ', e?.code);
    return NextResponse.json({
      error: 'Database error - did you run "npx prisma db push"?',
      detail: e?.message,
      code: e?.code,
    }, { status: 500 });
  }
}
