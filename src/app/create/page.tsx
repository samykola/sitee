'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Video, Image as ImageIcon, Upload, X, ArrowLeft,
  FlipHorizontal, Zap, ZapOff, Circle, Square, Check,
  Palette, Loader2, AlertCircle, Film,
} from 'lucide-react';
import { useCamera } from '@/lib/useCamera';
import { FILTERS, getFilterById } from '@/lib/filters';

type Mode = 'select' | 'camera' | 'preview' | 'form';
type RecordState = 'idle' | 'recording';

type Channel = { id: string; name: string; slug: string };
type UploadedMedia = {
  url: string;
  thumbUrl?: string | null;
  mediumUrl?: string | null;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
};

const MAX_RECORD_SECONDS = 60;

export default function CreatePage() {
  const router = useRouter();

  // Mode
  const [mode, setMode] = useState<Mode>('select');

  // Camera
  const {
    videoRef, facing, ready, error: cameraError,
    hasTorch, torchOn, start, stop, flip, toggleTorch,
  } = useCamera();
  const [filter, setFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Captured media
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video' | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // Form
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [channelId, setChannelId] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);

  // Upload
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordPreviewRef = useRef<HTMLVideoElement | null>(null);
  const currentFilterCss = getFilterById(filter).css;

  // Load channels once
  useEffect(() => {
    fetch('/api/channels?mine=1')
      .then(r => r.json())
      .then(d => {
        setChannels(d.channels || []);
        if (d.channels?.[0]) setChannelId(d.channels[0].id);
      })
      .catch(() => {});
  }, []);

  // Cleanup recorder + timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* noop */ }
      }
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Enter camera mode ───────────────────────────
  const openCamera = useCallback(async () => {
    setMode('camera');
    await start(facing);
  }, [facing, start]);

  const closeCamera = useCallback(() => {
    stop();
    setShowFilters(false);
    setRecordState('idle');
    setRecordSeconds(0);
    setMode('select');
  }, [stop]);

  // ─── Photo capture ───────────────────────────────
  async function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply CSS filter to canvas drawing
    ctx.filter = currentFilterCss;
    // Mirror if front camera
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setCapturedBlob(blob);
    setCapturedType('image');
    setCapturedUrl(url);
    setMode('preview');
    stop();
  }

  // ─── Video record ────────────────────────────────
  function startRecording() {
    if (!videoRef.current) return;

    const stream = (videoRef.current.srcObject as MediaStream) || null;
    if (!stream) return;

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const mimeType = mimeCandidates.find(m => {
      try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
    });

    try {
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedType('video');
        setCapturedUrl(url);
        setMode('preview');
        stop();
        setRecordState('idle');
        setRecordSeconds(0);
      };

      recorder.start(100);
      setRecordState('recording');
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => {
          const next = s + 1;
          if (next >= MAX_RECORD_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch (e: any) {
      setFormError('Recording failed: ' + (e?.message || 'unknown'));
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
  }

  // ─── Gallery upload ──────────────────────────────
  function pickFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setFormError('File too large (max 25MB)');
      return;
    }
    if (!/^(image|video)\//.test(file.type)) {
      setFormError('Only images or videos supported');
      return;
    }
    const url = URL.createObjectURL(file);
    setCapturedBlob(file);
    setCapturedType(file.type.startsWith('video') ? 'video' : 'image');
    setCapturedUrl(url);
    setMode('preview');
  }

  // ─── Retake ──────────────────────────────────────
  function retake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedType(null);
    setCapturedUrl(null);
    setMode('camera');
    start(facing);
  }

  // ─── Go to form (preview → form) ─────────────────
  function goToForm() {
    setMode('form');
  }

  // ─── Upload + publish ────────────────────────────
  async function publish() {
    setFormError(null);
    if (!capturedBlob && !caption.trim()) {
      setFormError('Add a caption or media first');
      return;
    }

    try {
      let media: UploadedMedia[] = [];
      if (capturedBlob) {
        setUploading(true);
        setProgress(0);
        const uploaded = await uploadBlob(capturedBlob, capturedType || 'image', setProgress);
        setUploading(false);
        media = [uploaded];
      }

      setPublishing(true);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption, tags, visibility,
          channelId: channelId || null,
          media,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Publish failed');
      }
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setUploading(false);
      setPublishing(false);
      setProgress(0);
    }
  }

  // ─── Render ──────────────────────────────────────
  return (
    <>
      {mode === 'select' && (
        <SelectMode
          onCamera={openCamera}
          onGallery={() => fileInputRef.current?.click()}
        />
      )}

      {mode === 'camera' && (
        <CameraMode
          videoRef={videoRef}
          ready={ready}
          error={cameraError}
          filterCss={currentFilterCss}
          facing={facing}
          hasTorch={hasTorch}
          torchOn={torchOn}
          recordState={recordState}
          recordSeconds={recordSeconds}
          filterId={filter}
          showFilters={showFilters}
          onClose={closeCamera}
          onFlip={flip}
          onTorch={toggleTorch}
          onToggleFilters={() => setShowFilters(v => !v)}
          onSelectFilter={id => setFilter(id)}
          onPhoto={takePhoto}
          onRecordStart={startRecording}
          onRecordStop={stopRecording}
          onGallery={() => fileInputRef.current?.click()}
        />
      )}

      {mode === 'preview' && capturedUrl && capturedType && (
        <PreviewMode
          url={capturedUrl}
          type={capturedType}
          onBack={retake}
          onNext={goToForm}
        />
      )}

      {mode === 'form' && (
        <FormMode
          previewUrl={capturedUrl}
          previewType={capturedType}
          caption={caption}
          tags={tags}
          visibility={visibility}
          channelId={channelId}
          channels={channels}
          progress={progress}
          uploading={uploading}
          publishing={publishing}
          error={formError}
          onCaption={setCaption}
          onTags={setTags}
          onVisibility={setVisibility}
          onChannel={setChannelId}
          onBack={() => setMode('preview')}
          onPublish={publish}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={pickFromGallery}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Select mode — two big buttons
// ═══════════════════════════════════════════════════════════════
function SelectMode({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Create</h1>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCamera}
          className="card p-6 flex flex-col items-center gap-3 hover:border-accent transition-all duration-200 active:scale-[0.98] group"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <div className="font-semibold">Camera</div>
            <div className="text-xs text-neutral-500 mt-0.5">Record or photo</div>
          </div>
        </button>

        <button
          onClick={onGallery}
          className="card p-6 flex flex-col items-center gap-3 hover:border-accent transition-all duration-200 active:scale-[0.98] group"
        >
          <div className="w-16 h-16 rounded-full bg-[#1f1f1f] border border-[#333] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-neutral-300" />
          </div>
          <div className="text-center">
            <div className="font-semibold">Gallery</div>
            <div className="text-xs text-neutral-500 mt-0.5">Upload from device</div>
          </div>
        </button>
      </div>

      <div className="card p-4 text-sm text-neutral-400 space-y-2">
        <div className="font-medium text-neutral-200 mb-1">Tips</div>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>Use good lighting for clearer clips</li>
          <li>Hold steady — clips up to 60 seconds</li>
          <li>Front/back camera and flash supported on mobile</li>
          <li>Images auto-optimize to WebP (medium + thumbnail)</li>
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Camera mode — full-screen TikTok-style
// ═══════════════════════════════════════════════════════════════
function CameraMode(props: {
  videoRef: React.RefObject<HTMLVideoElement>;
  ready: boolean;
  error: string | null;
  filterCss: string;
  facing: 'user' | 'environment';
  hasTorch: boolean;
  torchOn: boolean;
  recordState: RecordState;
  recordSeconds: number;
  filterId: string;
  showFilters: boolean;
  onClose: () => void;
  onFlip: () => void;
  onTorch: () => void;
  onToggleFilters: () => void;
  onSelectFilter: (id: string) => void;
  onPhoto: () => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  onGallery: () => void;
}) {
  const {
    videoRef, ready, error, filterCss, facing, hasTorch, torchOn,
    recordState, recordSeconds, filterId, showFilters,
    onClose, onFlip, onTorch, onToggleFilters, onSelectFilter,
    onPhoto, onRecordStart, onRecordStop, onGallery,
  } = props;
  const recording = recordState === 'recording';
  const minutes = Math.floor(recordSeconds / 60);
  const seconds = recordSeconds % 60;
  const timeLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onClose}
          disabled={recording}
          className="btn-ghost p-2 text-white bg-black/40 rounded-full disabled:opacity-40"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        {recording && (
          <div className="bg-red-500/90 text-white text-sm px-3 py-1 rounded-full font-mono font-bold flex items-center gap-2 animate-pulse">
            <Circle className="w-3 h-3 fill-white" /> {timeLabel}
          </div>
        )}
        {hasTorch && (
          <button
            onClick={onTorch}
            className={`p-2 rounded-full ${torchOn ? 'bg-yellow-500/90 text-black' : 'bg-black/40 text-white'}`}
            aria-label="Toggle flash"
          >
            {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={onFlip}
          disabled={recording}
          className="btn-ghost p-2 text-white bg-black/40 rounded-full disabled:opacity-40"
          aria-label="Flip camera"
        >
          <FlipHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Video preview */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error && (
          <div className="text-center text-neutral-300 p-6 max-w-sm">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-sm mb-4">{error}</p>
            <button onClick={onGallery} className="btn-primary">
              <Upload className="w-4 h-4" /> Upload instead
            </button>
          </div>
        )}
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
            style={{
              filter: filterCss,
              transform: facing === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        )}

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {recording && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-32 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: (recordSeconds / MAX_RECORD_SECONDS * 100) + '%' }}
            />
          </div>
        )}
      </div>

      {/* Filters strip */}
      {showFilters && (
        <div className="absolute bottom-32 inset-x-0 z-20 px-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => onSelectFilter(f.id)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative ${f.id === filterId ? 'ring-2 ring-accent' : 'ring-1 ring-white/20'}`}
              >
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
                  style={{ filter: f.css }} />
                <div className="absolute inset-0 flex items-end justify-center pb-1 text-[10px] font-medium text-white bg-gradient-to-t from-black/70 to-transparent">
                  {f.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent">
        <div className="max-w-md mx-auto flex items-end justify-between gap-4">
          {/* Gallery */}
          <button
            onClick={onGallery}
            disabled={recording}
            className="w-12 h-12 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-white disabled:opacity-40"
            aria-label="Pick from gallery"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Record / Photo */}
          {recording ? (
            <button
              onClick={onRecordStop}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Stop recording"
            >
              <Square className="w-8 h-8 text-white fill-white" />
            </button>
          ) : (
            <div className="relative">
              <button
                onMouseDown={onRecordStart}
                onTouchStart={(e) => { e.preventDefault(); onRecordStart(); }}
                className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Record video (hold)"
              >
                <span className="w-14 h-14 rounded-full bg-red-500" />
              </button>
            </div>
          )}

          {/* Photo / Filters */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onToggleFilters}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${showFilters ? 'bg-accent text-white' : 'bg-black/40 border border-white/20 text-white'}`}
              aria-label="Filters"
            >
              <Palette className="w-5 h-5" />
            </button>
            {!recording && (
              <button
                onClick={onPhoto}
                className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center"
                aria-label="Take photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {!recording && (
          <p className="text-center text-xs text-white/60 mt-3">
            Tap white button for photo · Hold red to record (max 60s)
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Preview mode — captured media
// ═══════════════════════════════════════════════════════════════
function PreviewMode({
  url, type, onBack, onNext,
}: {
  url: string;
  type: 'image' | 'video';
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      <div className="card overflow-hidden">
        {type === 'image' ? (
          <img src={url} alt="Preview" className="w-full max-h-[70vh] object-contain bg-black" />
        ) : (
          <video src={url} controls playsInline className="w-full max-h-[70vh] object-contain bg-black" />
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="btn-ghost flex-1">
          <ArrowLeft className="w-4 h-4" /> Retake
        </button>
        <button onClick={onNext} className="btn-primary flex-1">
          Next <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Form mode — caption, tags, publish
// ═══════════════════════════════════════════════════════════════
function FormMode(props: {
  previewUrl: string | null;
  previewType: 'image' | 'video' | null;
  caption: string;
  tags: string;
  visibility: string;
  channelId: string;
  channels: Channel[];
  progress: number;
  uploading: boolean;
  publishing: boolean;
  error: string | null;
  onCaption: (v: string) => void;
  onTags: (v: string) => void;
  onVisibility: (v: string) => void;
  onChannel: (v: string) => void;
  onBack: () => void;
  onPublish: () => void;
}) {
  const {
    previewUrl, previewType, caption, tags, visibility, channelId, channels,
    progress, uploading, publishing, error,
    onCaption, onTags, onVisibility, onChannel, onBack, onPublish,
  } = props;

  return (
    <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn-ghost p-2" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold flex-1">New Post</h1>
        <button
          onClick={onPublish}
          disabled={uploading || publishing}
          className="btn-primary text-sm"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : publishing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
          ) : (
            <><Check className="w-4 h-4" /> Publish</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-3">
        {previewUrl && previewType && (
          <div className="card overflow-hidden aspect-square md:aspect-[3/4]">
            {previewType === 'image' ? (
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={previewUrl} controls playsInline className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <div className="space-y-3">
          <textarea
            value={caption}
            onChange={e => onCaption(e.target.value)}
            placeholder="Write a caption…"
            rows={4}
            maxLength={2000}
            className="input"
          />

          <div>
            <label className="text-xs text-neutral-500">Tags</label>
            <input
              value={tags}
              onChange={e => onTags(e.target.value)}
              placeholder="art, gaming, music (comma separated)"
              className="input mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-neutral-500">Visibility</label>
              <select
                value={visibility}
                onChange={e => onVisibility(e.target.value)}
                className="input mt-1"
              >
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS">Followers only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500">Channel</label>
              <select
                value={channelId}
                onChange={e => onChannel(e.target.value)}
                className="input mt-1"
              >
                <option value="">Auto-assign</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>#{c.slug}</option>
                ))}
              </select>
            </div>
          </div>

          {uploading && (
            <div>
              <div className="text-xs text-neutral-400 mb-1">Uploading… {progress}%</div>
              <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-200"
                  style={{ width: progress + '%' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Upload helper
// ═══════════════════════════════════════════════════════════════
function uploadBlob(
  blob: Blob,
  kind: 'image' | 'video',
  onProgress: (p: number) => void
): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    const ext = kind === 'video'
      ? (blob.type.includes('mp4') ? '.mp4' : '.webm')
      : (blob.type.includes('png') ? '.png' : '.jpg');
    const filename = 'capture-' + Date.now() + ext;

    const fd = new FormData();
    fd.append('file', new File([blob], filename, { type: blob.type }));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const item = data.files?.[0];
          if (!item) return reject(new Error('Upload returned no file'));
          resolve(item);
        } catch (e) {
          reject(new Error('Invalid upload response'));
        }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
        catch { reject(new Error('Upload failed')); }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}
