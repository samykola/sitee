import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForms } from './SettingsForms';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/login');

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForms user={{
        username: me.username,
        email: me.email,
        role: me.role,
        profile: me.profile ? {
          displayName: me.profile.displayName,
          bio: me.profile.bio,
          avatarUrl: me.profile.avatarUrl,
          coverUrl: me.profile.coverUrl,
          website: me.profile.website,
          location: me.profile.location,
        } : null,
      }} />
    </div>
  );
}
