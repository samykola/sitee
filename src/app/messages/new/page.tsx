import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewMessageForm } from './NewMessageForm';

export const dynamic = 'force-dynamic';

export default async function NewMessagePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/login');
  return (
    <div className="max-w-lg mx-auto">
      <NewMessageForm />
    </div>
  );
}
