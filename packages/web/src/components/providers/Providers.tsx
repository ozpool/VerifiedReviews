'use client';

/**
 * Client-side provider tree.
 *
 * Why 'use client' here: wagmi, RainbowKit, and TanStack Query all need React
 * context which only exists in the client component tree. We push this boundary
 * as low as possible (a leaf provider wrapper) so the layout above it stays
 * server-rendered.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '@/lib/wagmi';
import { isPrivyEnabled } from '@/lib/wagmi.privy';
import { makeQueryClient } from '@/lib/queryClient';
import { EmbeddedWalletProvider } from './EmbeddedWalletProvider';
import { useState } from 'react';

// RainbowKit's lightTheme override matching editorial-trust tokens.
const rbkTheme = lightTheme({
  accentColor: '#D4541A',
  accentColorForeground: '#F9F6F1',
  borderRadius: 'small',
  fontStack: 'system',
});

export function Providers({ children }: { children: React.ReactNode }) {
  // When a Privy app id is configured, use the embedded-wallet tree (social
  // login + hidden wallet). Otherwise fall back to the plain wagmi + RainbowKit
  // path so the app still builds and runs without a Privy account.
  if (isPrivyEnabled) {
    return <EmbeddedWalletProvider>{children}</EmbeddedWalletProvider>;
  }
  return <FallbackProviders>{children}</FallbackProviders>;
}

/** Original wagmi + RainbowKit provider tree, used when Privy is not configured. */
function FallbackProviders({ children }: { children: React.ReactNode }) {
  // QueryClient is created inside the component with useState so that each
  // request in SSR gets its own instance (prevents cross-request data leakage).
  const [queryClient] = useState(makeQueryClient);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rbkTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
        {process.env['NODE_ENV'] === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
