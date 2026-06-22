'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListBusinesses, adminApprove, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

/** Admin moderation: the pending-business approval queue. */
export function ApprovalQueue({ token }: { token: string }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const pending = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => adminListBusinesses(token, 'pending'),
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminApprove(token, id),
    onSuccess: () => {
      setError('');
      qc.invalidateQueries({ queryKey: ['admin-pending'] });
    },
    onError: (err) =>
      setError(
        err instanceof ApiError && err.status === 502
          ? 'Approval failed: on-chain minter registration reverted (check the admin signer + funds).'
          : 'Approval failed. Please try again.',
      ),
  });

  if (pending.isPending) return <Loading label="Loading pending businesses…" />;
  if (pending.isError) {
    return (
      <ErrorState message="Couldn't load the approval queue." retry={() => pending.refetch()} />
    );
  }
  if (pending.data.length === 0) {
    return (
      <Empty title="Nothing pending" description="New business applications will appear here." />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-accent bg-accent-muted rounded p-3">
          {error}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {pending.data.map((b) => (
          <li key={b._id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-display font-semibold text-ink">{b.name}</p>
              <p className="text-xs text-muted">
                {b.city} · <span className="font-mono">{b.slug}</span>
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => approve.mutate(b._id)}
              loading={approve.isPending && approve.variables === b._id}
              disabled={approve.isPending}
            >
              Approve
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
