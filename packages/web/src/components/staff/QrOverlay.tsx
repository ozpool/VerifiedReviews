'use client';

import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  onDismiss: () => void;
}

/**
 * Full-screen overlay showing a QR code the customer scans to reach the
 * write-review page. Tap or press Escape to dismiss so staff can mint the next
 * customer immediately.
 *
 * The QR is generated client-side into a <canvas> — no server round-trip and no
 * image payload to load.
 */
export function QrOverlay({ url, onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import('qrcode')).default;
      if (cancelled || !canvasRef.current) return;
      await QRCode.toCanvas(canvasRef.current, url, {
        width: 260,
        margin: 2,
        color: { dark: '#1a1612', light: '#f9f6f1' },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    /* biome-ignore lint/a11y/useKeyWithClickEvents: overlay is dismiss-on-tap; keyboard handled via useEffect */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer QR code — scan to write a review"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Card — stop click from bubbling to backdrop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-6 bg-paper rounded-2xl px-10 py-10 shadow-2xl mx-4"
      >
        {/* Eyebrow */}
        <p className="text-xs font-medium tracking-widest uppercase text-muted">
          Customer — scan this QR code
        </p>

        {/* QR canvas */}
        <canvas
          ref={canvasRef}
          width={260}
          height={260}
          className="rounded-lg"
          aria-label={`QR code linking to ${url}`}
        />

        {/* CTA */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-display text-base font-semibold text-ink">
            Write your verified review
          </p>
          <p className="text-xs text-muted">Scan with your phone camera — no app needed</p>
        </div>

        {/* Dismiss hint */}
        <button
          onClick={onDismiss}
          className="mt-2 text-xs text-muted hover:text-ink transition-colors underline underline-offset-2"
        >
          Dismiss (next customer)
        </button>
      </div>

      {/* Tap-anywhere hint below card */}
      <p className="mt-6 text-xs text-paper/50 select-none">Tap anywhere outside to dismiss</p>
    </div>
  );
}
