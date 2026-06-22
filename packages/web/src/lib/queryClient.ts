import { QueryClient } from '@tanstack/react-query';

/**
 * Build the app's TanStack Query client. Factored out so both provider trees
 * (the Privy embedded path and the plain wagmi+RainbowKit fallback) share one
 * config. Created per-instance via useState in each provider so every SSR request
 * gets its own client (prevents cross-request data leakage).
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
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
  });
}
