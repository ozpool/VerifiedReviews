'use client';

/**
 * Pings GET /health and shows a live status indicator.
 *
 * Why 'use client' + TanStack Query: the health check should revalidate on
 * focus without a full page reload. useQuery handles caching, background
 * refetch, and the loading/error states without a `useEffect`.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/lib/api';

export function ApiHealth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    // Recheck every 30s; don't hammer the API
    refetchInterval: 30_000,
    // If the health endpoint fails, don't spam retries
    retry: 1,
  });

  return (
    <div className="flex items-center gap-2 text-sm" aria-live="polite">
      <span className="text-muted">API</span>
      {isLoading && (
        <>
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-border animate-pulse"
          />
          <span className="text-muted">checking…</span>
        </>
      )}
      {isError && (
        <>
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-accent"
            title="API unreachable"
          />
          <span className="text-accent">unreachable</span>
        </>
      )}
      {data && (
        <>
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-green-600"
            title="API online"
          />
          <span className="text-green-700">online</span>
          <span className="text-border">·</span>
          <span className="text-muted font-mono text-xs">
            up {Math.floor(data.uptime)}s
          </span>
        </>
      )}
    </div>
  );
}
