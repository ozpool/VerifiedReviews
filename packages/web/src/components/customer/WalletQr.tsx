'use client';

/**
 * "Show at checkout" — renders the customer's own wallet address as a QR code so
 * staff can scan it into the mint panel. Closes the scanner gap: Privy customers
 * have no external wallet "receive" screen, so this IS their address QR.
 *
 * Branches on isPrivyEnabled exactly like WalletStatus: each provider tree only
 * supports its own hooks (usePrivy needs PrivyProvider; ConnectButton needs
 * RainbowKitProvider), so we keep each in its own sub-component and render one.
 */
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { isPrivyEnabled } from '@/lib/wagmi.privy';

export function WalletQr() {
  return isPrivyEnabled ? <PrivyWalletQr /> : <RainbowKitWalletQr />;
}

/** Privy path: prompt social sign-in, then show the embedded wallet's address. */
function PrivyWalletQr() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useAccount();

  if (!ready) return <Skeleton />;
  if (!authenticated) {
    return (
      <Prompt
        message="Sign in to show your visit code at checkout."
        action={<PrimaryButton onClick={login}>Sign in</PrimaryButton>}
      />
    );
  }
  // Authenticated but the embedded wallet may still be provisioning.
  if (!address) return <Prompt message="Setting up your wallet…" />;
  return <QrCard address={address} />;
}

/** Fallback path: external wallet via RainbowKit. */
function RainbowKitWalletQr() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <Skeleton />;
  if (!isConnected || !address) {
    return (
      <Prompt
        message="Connect your wallet to show your visit code at checkout."
        action={<ConnectButton label="Connect wallet" />}
      />
    );
  }
  return <QrCard address={address} />;
}

/** The QR + address card. Reusable across both provider paths. */
function QrCard({ address }: { address: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import('qrcode')).default;
      if (cancelled || !canvasRef.current) return;
      await QRCode.toCanvas(canvasRef.current, address, {
        width: 240,
        margin: 2,
        color: { dark: '#1a1612', light: '#f9f6f1' },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col items-center gap-5 border border-border rounded-2xl px-8 py-8 max-w-sm mx-auto">
      <p className="text-xs font-medium tracking-widest uppercase text-muted">
        Show this at checkout
      </p>
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        className="rounded-lg"
        aria-label={`QR code of your wallet address ${address}`}
      />
      <div className="flex flex-col items-center gap-2 w-full">
        <code className="text-xs text-ink font-mono break-all text-center">{address}</code>
        <button
          onClick={copy}
          className="text-xs text-accent hover:text-accent-light transition-colors"
        >
          {copied ? 'Copied ✓' : 'Copy address'}
        </button>
      </div>
      <p className="text-xs text-muted text-center">
        Staff scans this to mint your visit receipt. Then you can write a verified review.
      </p>
    </div>
  );
}

function Prompt({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-border rounded-2xl px-8 py-10 max-w-sm mx-auto text-center">
      <p className="text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center bg-accent text-paper px-5 py-2.5 rounded text-sm font-medium tracking-wide hover:bg-accent-light transition-colors"
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div
      className="h-72 w-full max-w-sm mx-auto rounded-2xl bg-subtle animate-pulse"
      aria-hidden="true"
    />
  );
}
