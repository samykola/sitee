import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'ILLEGAL', 'COPYRIGHT', 'NSFW', 'OTHER']),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const report = await prisma.report.create({
      data: {
        reporterId: me.id,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details,
      },
    });
    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
