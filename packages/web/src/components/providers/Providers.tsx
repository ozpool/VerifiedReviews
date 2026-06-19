'use client';

/**
 * Client-side provider tree.
 *
 * Why 'use client' here: wagmi, RainbowKit, and TanStack Query all need React
 * context which only exists in the client component tree. We push this boundary
 * as low as possible (a leaf provider wrapper) so the layout above it stays
 * server-rendered.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '@/lib/wagmi';
import { useState } from 'react';

// RainbowKit's lightTheme override matching editorial-trust tokens.
const rbkTheme = lightTheme({
  accentColor: '#D4541A',
  accentColorForeground: '#F9F6F1',
  borderRadius: 'small',
  fontStack: 'system',
});

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient is created inside the component with useState so that each
  // request in SSR gets its own instance (prevents cross-request data leakage).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale after 30s; data shows immediately while revalidating.
            staleTime: 30_000,
            // Don't retry on 4xx — those are permanent errors.
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes('4')) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rbkTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
        {process.env['NODE_ENV'] === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
