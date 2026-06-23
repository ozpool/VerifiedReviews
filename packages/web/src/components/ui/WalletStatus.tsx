'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePrivy } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'wagmi/chains';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@vr/shared';
import { isPrivyEnabled } from '@/lib/wagmi.privy';

/**
 * Header wallet status. Branches on isPrivyEnabled so each path uses only the
 * hooks valid in its provider tree. RainbowKit's ConnectButton must NOT render
 * inside PrivyProvider (no RainbowKitProvider context); usePrivy must NOT be
 * called inside FallbackProviders (no PrivyProvider context). We solve this by
 * keeping each hook in its own sub-component and rendering only one of them.
 */
export function WalletStatus() {
  return isPrivyEnabled ? <PrivyStatus /> : <RainbowKitStatus />;
}

/** Privy path — social sign-in creates a hidden wallet automatically. */
function PrivyStatus() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const chainId = useChainId();

  if (!ready) return <Skeleton />;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="text-sm font-medium text-ink border border-border rounded px-3.5 py-1.5 hover:bg-subtle transition-colors"
      >
        Sign in
      </button>
    );
  }

  const wrongChain = chainId !== ARBITRUM_SEPOLIA_CHAIN_ID;
  return (
    <div className="flex items-center gap-3">
      {/* Once signed in, the visit-code hand-off is always one tap away — staff
          scan this to mint the receipt that unlocks a verified review. */}
      <Link
        href="/wallet"
        className="text-sm font-medium text-ink border border-border rounded px-3.5 py-1.5 hover:bg-subtle transition-colors"
      >
        Show your code
      </Link>
      {address && (
        <span className="text-xs text-muted font-mono hidden sm:block">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      )}
      {wrongChain && (
        <span className="text-xs text-accent font-medium">Switch to {arbitrumSepolia.name}</span>
      )}
      <button
        onClick={() => void logout()}
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

/** RainbowKit path — MetaMask / WalletConnect connector modal. */
function RainbowKitStatus() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton />;
  if (!isConnected) return <ConnectButton label="Connect wallet" />;

  return (
    <div className="flex flex-col gap-1 items-end">
      <ConnectButton showBalance={false} chainStatus="icon" />
      {chainId !== ARBITRUM_SEPOLIA_CHAIN_ID && (
        <p role="alert" className="text-xs text-accent font-medium">
          Switch to {arbitrumSepolia.name}
        </p>
      )}
    </div>
  );
}

function Skeleton() {
  return <div className="h-9 w-28 rounded bg-subtle animate-pulse" aria-hidden="true" />;
}
