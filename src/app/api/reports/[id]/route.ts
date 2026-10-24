import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(me.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { action } = await req.json();
  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let status: 'PENDING' | 'REVIEWING' | 'DISMISSED' | 'RESOLVED' = report.status;
  if (action === 'review') status = 'REVIEWING';
  else if (action === 'dismiss') status = 'DISMISSED';
  else if (action === 'resolve') status = 'RESOLVED';

  if (action === 'delete') {
    if (report.targetType === 'post') {
      await prisma.post.delete({ where: { id: report.targetId } }).catch(() => {});
    } else if (report.targetType === 'comment') {
      await prisma.comment.delete({ where: { id: report.targetId } }).catch(() => {});
    } else if (report.targetType === 'user') {
      await prisma.user.update({ where: { id: report.targetId }, data: { isBanned: true } }).catch(() => {});
    }
    status = 'RESOLVED';
  }

  await prisma.report.update({
    where: { id: params.id },
    data: { status, handledById: me.id },
  });

  await prisma.adminAction.create({
    data: {
      adminId: me.id,
      action: action || 'review',
      targetType: 'report',
      targetId: params.id,
      metadata: { reportTargetType: report.targetType, reportTargetId: report.targetId },
    },
  });

  return NextResponse.json({ ok: true });
}
