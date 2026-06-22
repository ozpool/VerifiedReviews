'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

/**
 * Live camera QR scanner. Decodes continuously and reports the first text it
 * reads. Loaded dynamically (ssr: false) so the camera APIs never run on the
 * server. If the camera can't be opened, the parent's manual entry still works.
 */
export function CameraScanner({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const reader = new BrowserQRCodeReader();
    let controls: { stop: () => void } | undefined;
    let active = true;

    reader
      .decodeFromVideoDevice(undefined, el, (result) => {
        if (result && active) onResult(result.getText());
      })
      .then((c) => {
        controls = c;
      })
      .catch(() => setError('Could not access the camera — use manual entry below.'));

    return () => {
      active = false;
      controls?.stop();
    };
  }, [onResult]);

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={videoRef}
        className="w-full max-w-sm aspect-square rounded border border-border bg-ink/5 object-cover"
        muted
        playsInline
      />
      {error && (
        <p role="alert" className="text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
