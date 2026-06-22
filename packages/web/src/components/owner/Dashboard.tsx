'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBadge, fetchReviews } from '@/lib/api';
import { summarizeSentiment, percent } from '@/lib/sentiment';
import { RatingStars } from '@/components/business/RatingStars';
import { Loading, ErrorState } from '@/components/ui/StatusStates';

/** Owner dashboard: verified count + average, and a sentiment breakdown bar. */
export function Dashboard({ businessId }: { businessId: number }) {
  const badge = useQuery({
    queryKey: ['badge', businessId],
    queryFn: () => fetchBadge(businessId),
  });
  const reviews = useQuery({
    queryKey: ['reviews', businessId, ''],
    queryFn: () => fetchReviews(businessId),
  });

  if (badge.isPending || reviews.isPending) return <Loading label="Loading dashboard…" />;
  if (badge.isError || reviews.isError) {
    return (
      <ErrorState
        message="Couldn't load your dashboard."
        retry={() => {
          badge.refetch();
          reviews.refetch();
        }}
      />
    );
  }

  const s = summarizeSentiment(reviews.data);
  const bars: Array<{ key: keyof typeof s; label: string; color: string }> = [
    { key: 'positive', label: 'Positive', color: 'bg-accent' },
    { key: 'neutral', label: 'Neutral', color: 'bg-muted' },
    { key: 'negative', label: 'Negative', color: 'bg-ink' },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <Stat label="Verified reviews" value={String(badge.data.count)} />
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl font-bold tabular-nums text-ink">
            {badge.data.avgRating.toFixed(1)}
          </span>
          <div className="flex flex-col gap-1">
            <RatingStars rating={badge.data.avgRating} />
            <span className="text-xs text-muted">average rating</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Sentiment</span>
        {s.total === 0 ? (
          <p className="text-sm text-muted">No verified reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bars.map((b) => (
              <div key={b.key} className="flex items-center gap-3">
                <span className="w-16 text-xs text-muted">{b.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-subtle overflow-hidden">
                  <div
                    className={`h-full ${b.color}`}
                    style={{ width: `${percent(s[b.key], s.total)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-muted">
                  {percent(s[b.key], s.total)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-4xl font-bold tabular-nums text-ink">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
