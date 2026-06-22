'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { mintVisitProof, ApiError, type StaffSession } from '@/lib/api';
import { isEvmAddress } from '@/lib/address';
import { txUrl, shortHex } from '@/lib/explorer';
import { Button } from '@/components/ui/Button';
import { QrOverlay } from './QrOverlay';

const CameraScanner = dynamic(() => import('./CameraScanner').then((m) => m.CameraScanner), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Starting camera…</p>,
});

const APP_URL =
  (typeof window !== 'undefined' ? window.location.origin : null) ??
  process.env['NEXT_PUBLIC_APP_URL'] ??
  'http://localhost:3000';

type Phase = 'idle' | 'minting' | 'done' | 'error';

/**
 * Scan (or type) a customer's wallet address, then mint their VisitProof. The
 * camera is optional — manual entry always works, which also keeps the mint flow
 * usable on devices without a camera.
 */
export function MintPanel({ session, onMinted }: { session: StaffSession; onMinted: () => void }) {
  const [addr, setAddr] = useState('');
  const [scanning, setScanning] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [showQr, setShowQr] = useState(false);

  const reviewUrl = `${APP_URL}/b/${session.slug}/write`;

  const valid = isEvmAddress(addr);

  function handleScan(text: string) {
    const t = text.trim();
    if (isEvmAddress(t)) {
      setAddr(t);
      setScanning(false);
    }
  }

  async function mint() {
    setError('');
    setPhase('minting');
    try {
      const r = await mintVisitProof(session.token, session.businessId, addr.trim());
      setTxHash(r.txHash);
      setPhase('done');
      setAddr('');
      onMinted();
      setShowQr(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 429
            ? 'Mint rate limit reached for this business — try again shortly.'
            : `Mint failed (${err.status}).`
          : 'Mint failed. Check your connection and try again.',
      );
      setPhase('error');
    }
  }

  return (
    <>
      {showQr && session.slug && <QrOverlay url={reviewUrl} onDismiss={() => setShowQr(false)} />}
      <div className="flex flex-col gap-4 border border-border rounded p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Mint a VisitProof</h2>
          <button
            type="button"
            onClick={() => setScanning((s) => !s)}
            className="text-sm text-accent hover:text-accent-light"
          >
            {scanning ? 'Close camera' : 'Scan QR'}
          </button>
        </div>

        {scanning && <CameraScanner onResult={handleScan} />}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink">Customer wallet address</span>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="0x…"
            aria-label="Customer wallet address"
            className="w-full bg-paper border border-border rounded px-3.5 py-2.5 text-sm font-mono text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          />
          {addr && !valid && (
            <span className="text-xs text-accent">That isn&apos;t a valid wallet address.</span>
          )}
        </label>

        {phase === 'error' && (
          <p role="alert" className="text-sm text-accent bg-accent-muted rounded p-3">
            {error}
          </p>
        )}

        {phase === 'done' && txHash && (
          <p className="text-sm text-ink bg-accent-muted rounded p-3">
            Minted ✓{' '}
            <a
              href={txUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {shortHex(txHash, 8, 6)}
            </a>
          </p>
        )}

        <Button
          onClick={mint}
          disabled={!valid || phase === 'minting'}
          loading={phase === 'minting'}
        >
          Mint VisitProof
        </Button>
      </div>
    </>
  );
}
