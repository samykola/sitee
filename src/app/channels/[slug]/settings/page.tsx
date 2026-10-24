import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function ChannelSettingsPage({ params }: { params: { slug: string } }) {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/login');

  const channel = await prisma.channel.findUnique({ where: { slug: params.slug } });
  if (!channel) return notFound();
  if (channel.ownerId !== me.id) redirect('/channels/' + params.slug);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <SettingsForm
        channel={{
          slug: channel.slug,
          name: channel.name,
          description: channel.description,
          avatarUrl: channel.avatarUrl,
          bannerUrl: channel.bannerUrl,
          isPublic: channel.isPublic,
        }}
      />
    </div>
  );
}
