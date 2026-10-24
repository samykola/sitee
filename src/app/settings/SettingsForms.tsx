'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';
import { Upload } from 'lucide-react';

type User = {
  username: string;
  email: string;
  role: string;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    website: string | null;
    location: string | null;
  } | null;
};

export function SettingsForms({ user }: { user: User }) {
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  return (
    <div className="space-y-4">
      <div className="card p-1 flex gap-1">
        <button onClick={() => setTab('profile')}
          className={'px-4 py-2 rounded-lg text-sm ' + (tab === 'profile' ? 'bg-[#242424] text-white' : 'text-neutral-400')}>
          Profile
        </button>
        <button onClick={() => setTab('security')}
          className={'px-4 py-2 rounded-lg text-sm ' + (tab === 'security' ? 'bg-[#242424] text-white' : 'text-neutral-400')}>
          Security
        </button>
      </div>
      {tab === 'profile' ? <ProfileForm user={user} /> : <SecurityForm />}
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    displayName: user.profile?.displayName || '',
    bio: user.profile?.bio || '',
    avatarUrl: user.profile?.avatarUrl || '',
    coverUrl: user.profile?.coverUrl || '',
    website: user.profile?.website || '',
    location: user.profile?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  async function uploadImage(file: File, kind: 'avatar' | 'cover') {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.files?.[0]) {
        const url = data.files[0].mediumUrl || data.files[0].url;
        setForm(f => ({ ...f, [kind === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }));
        toast('Image uploaded', 'success');
      } else {
        toast(data.error || 'Upload failed', 'error');
      }
    } finally { setUploading(null); }
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast('Profile updated', 'success');
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error || 'Save failed', 'error');
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <label className="text-xs text-neutral-500">Cover</label>
        <div className="mt-1 relative h-32 rounded-xl overflow-hidden bg-[#111] flex items-center justify-center group cursor-pointer"
          onClick={() => document.getElementById('coverInput')?.click()}>
          {form.coverUrl && <img src={form.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="relative z-10 opacity-0 group-hover:opacity-100 transition bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs">
            <Upload className="w-4 h-4" /> {uploading === 'cover' ? '…' : 'Change'}
          </div>
          <input id="coverInput" type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')} />
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500">Avatar</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111] flex items-center justify-center cursor-pointer group relative"
            onClick={() => document.getElementById('avatarInput')?.click()}>
            {form.avatarUrl && <img src={form.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="relative z-10 opacity-0 group-hover:opacity-100 bg-black/60 p-1.5 rounded-full">
              <Upload className="w-4 h-4" />
            </div>
            <input id="avatarInput" type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'avatar')} />
          </div>
          <div className="text-xs text-neutral-500">Click to change</div>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500">Display name</label>
        <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
          className="input mt-1" maxLength={60} />
      </div>
      <div>
        <label className="text-xs text-neutral-500">Bio</label>
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          className="input mt-1" rows={3} maxLength={500} />
      </div>
      <div>
        <label className="text-xs text-neutral-500">Website</label>
        <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
          className="input mt-1" maxLength={120} placeholder="https://…" />
      </div>
      <div>
        <label className="text-xs text-neutral-500">Location</label>
        <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="input mt-1" maxLength={80} />
      </div>
      <button onClick={save} disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function SecurityForm() {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast('Passwords do not match', 'error'); return; }
    if (next.length < 8) { toast('New password must be at least 8 chars', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        toast('Password updated', 'success');
        setCurrent(''); setNext(''); setConfirm('');
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error || 'Update failed', 'error');
      }
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-3">
      <h2 className="font-bold">Change Password</h2>
      <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
        placeholder="Current password" className="input" required />
      <input type="password" value={next} onChange={e => setNext(e.target.value)}
        placeholder="New password (min 8)" className="input" required minLength={8} />
      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
        placeholder="Confirm new password" className="input" required minLength={8} />
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
