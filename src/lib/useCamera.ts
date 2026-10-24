'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type FacingMode = 'user' | 'environment';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<FacingMode>('user');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  const start = useCallback(async (mode: FacingMode) => {
    stop();
    setError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Detect torch capability
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setHasTorch(!!caps.torch);

      setReady(true);
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError' ? 'Camera permission denied. Allow access in your browser.' :
        e?.name === 'NotFoundError'    ? 'No camera found on this device.' :
        e?.name === 'NotReadableError' ? 'Camera is in use by another app.' :
        e?.message || 'Failed to start camera';
      setError(msg);
      setReady(false);
    }
  }, [stop]);

  const flip = useCallback(async () => {
    const next: FacingMode = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    await start(next);
  }, [facing, start]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch { /* ignore */ }
  }, [torchOn]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    videoRef,
    facing,
    ready,
    error,
    hasTorch,
    torchOn,
    start,
    stop,
    flip,
    toggleTorch,
  };
}
