'use client';

/**
 * Shows the connected wallet address + chain, or a connect button.
 *
 * Why 'use client': wagmi hooks (`useAccount`, `useChainId`) read from React
 * context; they can't run in a Server Component.
 *
 * The `mounted` guard prevents the hydration mismatch that would occur if the
 * server renders "disconnected" but the client immediately has a wallet — the
 * browser would see a mismatch and throw. We render nothing until mount.
 */
import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@vr/shared';

export function WalletStatus() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render wallet state until the client has hydrated.
  if (!mounted) {
    return (
      <div className="h-10 w-40 rounded bg-subtle animate-pulse" aria-hidden="true" />
    );
  }

  if (!isConnected) {
    return <ConnectButton label="Connect wallet" />;
  }

  const isCorrectChain = chainId === ARBITRUM_SEPOLIA_CHAIN_ID;

  return (
    <div className="flex flex-col gap-2">
      <ConnectButton showBalance={false} chainStatus="icon" />
      {!isCorrectChain && (
        <p role="alert" className="text-xs text-accent font-medium">
          Switch to {arbitrumSepolia.name} to interact with VerifiedReviews.
        </p>
      )}
      {isConnected && address && (
        <p className="text-xs text-muted font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </p>
      )}
    </div>
  );
}
