'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListFlags, adminResolveFlag } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

/** Admin moderation: the open spam/abuse flag queue. Dismiss = false alarm;
 * Hide = drop the review from public search + badge counts (chain untouched). */
export function FlagQueue({ token }: { token: string }) {
  const qc = useQueryClient();

  const flags = useQuery({
    queryKey: ['admin-flags'],
    queryFn: () => adminListFlags(token),
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'dismiss' | 'hide' }) =>
      adminResolveFlag(token, id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flags'] }),
  });

  if (flags.isPending) return <Loading label="Loading flags…" />;
  if (flags.isError) {
    return <ErrorState message="Couldn't load the flag queue." retry={() => flags.refetch()} />;
  }
  if (flags.data.length === 0) {
    return <Empty title="No open flags" description="Reported reviews will appear here." />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {flags.data.map((f) => (
        <li key={f._id} className="flex flex-col gap-2 py-4">
          <p className="text-sm text-ink">
            {f.review ? `“${f.review.text}”` : <span className="text-muted">review deleted</span>}
          </p>
          <p className="text-xs text-muted">
            Reported: <span className="text-ink">{f.reason}</span>
            {f.review && (
              <>
                {' · '}business <span className="font-mono">#{f.review.businessId}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => resolve.mutate({ id: f._id, action: 'hide' })}
              loading={resolve.isPending && resolve.variables?.id === f._id}
              disabled={resolve.isPending}
            >
              Hide review
            </Button>
            <button
              onClick={() => resolve.mutate({ id: f._id, action: 'dismiss' })}
              disabled={resolve.isPending}
              className="text-sm text-muted hover:text-ink transition-colors disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
