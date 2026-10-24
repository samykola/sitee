'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';

export function VoiceRecorder({
  onCancel,
  onSend,
}: {
  onCancel: () => void;
  onSend: (blob: Blob, durationSec: number) => Promise<void>;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        if (timerRef.current) clearInterval(timerRef.current);
      };

      rec.start(100);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError' ? 'Microphone permission denied' :
        e?.name === 'NotFoundError' ? 'No microphone found' :
        e?.message || 'Failed to start recording';
      setError(msg);
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  }

  async function send() {
    if (!blob) return;
    setSending(true);
    try {
      await onSend(blob, seconds || 1);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setBlob(null);
    setSeconds(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  useEffect(() => {
    return () => {
      stop();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-3 space-y-2">
      {error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : !blob ? (
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="btn-ghost p-2 flex-shrink-0" aria-label="Cancel">
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center text-sm">
            {recording ? (
              <span className="text-red-400 font-mono">{seconds}s — recording…</span>
            ) : (
              <span className="text-neutral-400">Tap red to record</span>
            )}
          </div>
          {!recording ? (
            <button onClick={start} className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center" aria-label="Start recording">
              <Mic className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button onClick={stop} className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse" aria-label="Stop recording">
              <Square className="w-5 h-5 text-white fill-white" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={reset} className="btn-ghost p-2 flex-shrink-0" aria-label="Discard">
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
          <audio src={previewUrl || undefined} controls className="flex-1 h-10" />
          <span className="text-xs text-neutral-500">{seconds}s</span>
          <button onClick={send} disabled={sending} className="btn-primary px-3 h-10 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
