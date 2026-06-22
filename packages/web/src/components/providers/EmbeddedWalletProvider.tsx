'use client';

/**
 * The embedded-wallet provider tree (Privy path).
 *
 * Why these three nested providers, in this order:
 *  1. PrivyProvider   — handles social login + creates the hidden wallet.
 *  2. QueryClientProvider — wagmi v2 reads/writes go through TanStack Query.
 *  3. WagmiProvider (from @privy-io/wagmi) — the wagmi context, Privy-aware so
 *     `useAccount()` / `useWriteContract()` see the embedded wallet like any other.
 * Privy requires Wagmi to sit *inside* both Privy and Query contexts, so the order
 * is not interchangeable.
 *
 * `embeddedWallets.createOnLogin: 'users-without-wallets'` is the key knob: a
 * wallet is minted only for users who don't already have one connected. A
 * customer who connects their own MetaMask is left untouched — that satisfies the
 * "never affect an existing wallet" requirement.
 */
import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { PRIVY_APP_ID, privyWagmiConfig } from '@/lib/wagmi.privy';
import { makeQueryClient } from '@/lib/queryClient';

export function EmbeddedWalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Customer-friendly logins; 'wallet' keeps crypto-native users first-class.
        loginMethods: ['google', 'email', 'wallet'],
        // Create the hidden wallet only when the user has none of their own.
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={privyWagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
