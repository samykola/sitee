import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ count: 0 });

    // Defensive: if the DM models aren't in the generated client yet,
    // return 0 instead of crashing with a 500.
    const cp = (prisma as any).conversationParticipant;
    const msgModel = (prisma as any).message;
    if (!cp || !msgModel) return NextResponse.json({ count: 0 });

    const parts = await cp.findMany({
      where: { userId: me.id },
      select: { conversationId: true, lastReadAt: true },
    });
    if (parts.length === 0) return NextResponse.json({ count: 0 });

    const counts = await Promise.all(
      parts.map((p: any) =>
        msgModel.count({
          where: {
            conversationId: p.conversationId,
            authorId: { not: me.id },
            createdAt: { gt: p.lastReadAt },
          },
        })
      )
    );
    return NextResponse.json({
      count: counts.reduce((a: number, b: number) => a + b, 0),
    });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
