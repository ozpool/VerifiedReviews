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
 * Login is Google/email ONLY — deliberately NO 'wallet' method. An external
 * wallet (MetaMask) shows its OWN confirmation popup on every transaction, which
 * no app setting can suppress, and it would also tie the visit receipt to the
 * MetaMask address so the review would have to be signed there too. By offering
 * only social login we guarantee every customer is on the Privy embedded wallet
 * end-to-end (receipt minted to it, review signed by it), which is the only way
 * to make the whole flow popup-free.
 *
 * `embeddedWallets.createOnLogin: 'all-users'` then guarantees that wallet always
 * exists (no external wallet can be linked now, so there's nothing to "preserve"),
 * and `showWalletUIs: false` makes it sign and send transactions silently — no
 * confirmation modal. Safe because the only transaction the app ever sends is
 * `ReviewRegistry.submit` for the review the customer just wrote; we never sign
 * arbitrary payloads on their behalf.
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
        // Social login ONLY — no 'wallet'. This is what keeps the flow popup-free:
        // an external wallet (MetaMask) always shows its own unsuppressable confirm.
        loginMethods: ['google', 'email'],
        // Always create the hidden wallet, and sign/send its transactions silently
        // (no confirmation modal) so the review submit has no wallet popup at all.
        embeddedWallets: { createOnLogin: 'all-users', showWalletUIs: false },
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
