'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, Trash2, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

type Channel = {
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
};

export function SettingsForm({ channel }: { channel: Channel }) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');
  const [avatarUrl, setAvatarUrl] = useState(channel.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(channel.bannerUrl || '');
  const [isPublic, setIsPublic] = useState(channel.isPublic);

  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function uploadImage(file: File, kind: 'avatar' | 'banner') {
    if (file.size > 25 * 1024 * 1024) {
      toast('File too large (max 25MB)', 'error');
      return;
    }
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const url = data.files?.[0]?.mediumUrl || data.files?.[0]?.url;
      if (kind === 'avatar') setAvatarUrl(url);
      else setBannerUrl(url);
      toast('Image uploaded', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/channels/' + channel.slug, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          avatarUrl: avatarUrl || null,
          bannerUrl: bannerUrl || null,
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast('Channel updated', 'success');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteChannel() {
    setDeleting(true);
    try {
      const res = await fetch('/api/channels/' + channel.slug, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      toast('Channel deleted', 'success');
      router.push('/channels');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={'/channels/' + channel.slug} className="btn-ghost p-2" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Channel Settings</h1>
        <button onClick={save} disabled={saving || uploading !== null} className="btn-primary text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Banner */}
      <div className="card overflow-hidden">
        <div className="p-4">
          <label className="text-xs text-neutral-500">Banner</label>
          <div
            className="mt-1 relative h-32 rounded-xl overflow-hidden bg-[#111] flex items-center justify-center cursor-pointer group"
            onClick={() => document.getElementById('bannerInput')?.click()}
          >
            {bannerUrl && (
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="relative z-10 bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition">
              {uploading === 'banner' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-4 h-4" /> Change</>
              )}
            </div>
            <input
              id="bannerInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')}
            />
          </div>
        </div>

        <div className="px-4 pb-4 flex items-end gap-3">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden bg-[#111] flex items-center justify-center cursor-pointer group relative flex-shrink-0"
            onClick={() => document.getElementById('avatarInput')?.click()}
          >
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="relative z-10 opacity-0 group-hover:opacity-100 transition bg-black/70 p-2 rounded-full">
              {uploading === 'avatar' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'avatar')}
            />
          </div>
          <div className="flex-1 text-xs text-neutral-500 pb-1">
            Click avatar or banner to change image
          </div>
        </div>
      </div>

      {/* General */}
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-neutral-300">General</h2>

        <div>
          <label className="text-xs text-neutral-500">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="input mt-1"
            maxLength={60}
            minLength={2}
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Slug (cannot change)</label>
          <input value={channel.slug} className="input mt-1 opacity-60" disabled />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input mt-1"
            rows={3}
            maxLength={500}
          />
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-4">
        <h2 className="font-semibold text-sm text-neutral-300 mb-3">Privacy</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!isPublic}
            onChange={e => setIsPublic(!e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <div>
            <div className="text-sm font-medium">Private channel</div>
            <div className="text-xs text-neutral-500">
              When private, only you can view this channel and its posts.
            </div>
          </div>
        </label>
      </div>

      {/* Danger */}
      <div className="card p-4 border-red-500/20">
        <h2 className="font-semibold text-sm text-red-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" /> Delete this channel
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-300">
              This will permanently delete <b>@{channel.slug}</b> and all its posts. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-ghost text-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={deleteChannel}
                disabled={deleting}
                className="btn text-sm flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, delete permanently</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
