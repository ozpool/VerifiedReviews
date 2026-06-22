'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMints } from '@/lib/api';
import { txUrl, shortHex } from '@/lib/explorer';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

/** Today's mint log for the signed-in staff's business. Invalidated after a mint. */
export function MintLog({ token }: { token: string }) {
  const query = useQuery({
    queryKey: ['mints'],
    queryFn: () => fetchMints(token),
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">Recent mints</h2>
      {query.isPending ? (
        <Loading label="Loading mints…" />
      ) : query.isError ? (
        <ErrorState message="Couldn't load the mint log." retry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <Empty title="No mints yet today" description="Minted VisitProofs will appear here." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {query.data.map((m) => (
            <li key={m.txHash} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono text-ink">{shortHex(m.customerAddr)}</span>
              <span className="flex items-center gap-4">
                <time className="text-xs text-muted" dateTime={m.createdAt}>
                  {new Date(m.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                <a
                  href={txUrl(m.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-light font-mono text-xs"
                >
                  {shortHex(m.txHash)} ↗
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
