import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReportRow } from './ReportRow';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const me = await getCurrentUser();
  if (!me || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(me.role)) redirect('/');

  const reports = await prisma.report.findMany({
    where: { status: { in: ['PENDING', 'REVIEWING'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      reporter: { include: { profile: true } },
      handledBy: { include: { profile: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports Queue</h1>
      {reports.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">No pending reports. 🎉</div>
      ) : (
        <div className="space-y-2">
          {reports.map(r => (
            <ReportRow key={r.id} report={{
              id: r.id,
              targetType: r.targetType,
              targetId: r.targetId,
              reason: r.reason,
              details: r.details,
              status: r.status,
              createdAt: r.createdAt.toISOString(),
              reporter: { username: r.reporter.username },
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
