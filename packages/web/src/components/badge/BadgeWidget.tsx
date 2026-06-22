'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBadge } from '@/lib/api';
import { RatingStars } from '@/components/business/RatingStars';

/**
 * Compact verified-review badge, served at /badge/:id for embedding in an iframe
 * on a business's own site. Shows the on-chain-derived count + average rating.
 */
export function BadgeWidget({ businessId }: { businessId: number }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['badge', businessId],
    queryFn: () => fetchBadge(businessId),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-3">
      <div className="w-full max-w-[240px] border-2 border-dashed border-accent rounded p-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-accent">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path
              d="M4 10.5l4.5 4.5 7.5-9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs font-semibold tracking-wide uppercase">VerifiedReviews</span>
        </div>
        {isPending ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-muted">Unavailable</p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tabular-nums text-ink">
                {data.avgRating.toFixed(1)}
              </span>
              <RatingStars rating={data.avgRating} size="sm" />
            </div>
            <span className="text-xs text-muted">{data.count} verified</span>
          </div>
        )}
      </div>
    </div>
  );
}
