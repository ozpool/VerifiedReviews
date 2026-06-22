'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBusiness, fetchBadge, fetchReviews, ApiError } from '@/lib/api';
import { RatingStars } from './RatingStars';
import { VerifiedStamp } from './VerifiedStamp';
import { ReviewCard } from './ReviewCard';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';
import { safeHttpUrl } from '@/lib/url';

/**
 * Business detail: profile, the on-chain-verified count + average, and the
 * review list. Each review links out to its tx, so the headline numbers here are
 * auditable rather than asserted.
 */
export function BusinessDetailClient({ slug }: { slug: string }) {
  const [q, setQ] = useState('');

  const businessQuery = useQuery({
    queryKey: ['business', slug],
    queryFn: () => fetchBusiness(slug),
    retry: false,
  });
  const business = businessQuery.data;
  const businessId = business?.businessId;

  const badgeQuery = useQuery({
    queryKey: ['badge', businessId],
    enabled: businessId !== undefined,
    queryFn: () => fetchBadge(businessId!),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', businessId, q],
    enabled: businessId !== undefined,
    queryFn: () => fetchReviews(businessId!, q || undefined),
  });

  if (businessQuery.isPending) return <Loading label="Loading business…" />;
  if (businessQuery.isError) {
    const notFound = businessQuery.error instanceof ApiError && businessQuery.error.status === 404;
    return notFound ? (
      <Empty
        title="Business not found"
        description="This business isn't listed (or isn't approved yet)."
      />
    ) : (
      <ErrorState message="Couldn't load this business." retry={() => businessQuery.refetch()} />
    );
  }
  // Success implies data is present; this also narrows `business` for the JSX.
  if (!business) return null;

  const badge = badgeQuery.data;
  const reviews = reviewsQuery.data ?? [];
  // Only ever link out to a validated http(s) URL — rejects javascript:/data: etc.
  const website = safeHttpUrl(business.websiteUrl);

  return (
    <div className="flex flex-col gap-10">
      {/* Profile header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-accent" aria-hidden="true" />
          <span className="text-xs font-medium tracking-widest uppercase text-muted">
            {business.category} · {business.city}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] text-ink">
          {business.name}
        </h1>
        {business.description && (
          <p className="text-base text-muted leading-relaxed max-w-2xl">{business.description}</p>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:text-accent-light transition-colors w-fit"
          >
            {website.replace(/^https?:\/\//, '')} ↗
          </a>
        )}
      </header>

      {/* Verified stats strip */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-border py-5">
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl font-bold tabular-nums text-ink">
            {badge ? badge.avgRating.toFixed(1) : '—'}
          </span>
          <div className="flex flex-col gap-1">
            <RatingStars rating={badge?.avgRating ?? 0} />
            <span className="text-xs text-muted">average rating</span>
          </div>
        </div>
        <VerifiedStamp count={badge?.count ?? 0} />
      </div>

      {/* Reviews */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">Verified reviews</h2>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews…"
            aria-label="Search this business's reviews"
            className="bg-paper border border-border rounded px-3.5 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          />
        </div>

        {reviewsQuery.isPending ? (
          <Loading label="Loading reviews…" />
        ) : reviewsQuery.isError ? (
          <ErrorState message="Couldn't load reviews." retry={() => reviewsQuery.refetch()} />
        ) : reviews.length === 0 ? (
          <Empty
            title={q ? 'No matching reviews' : 'No verified reviews yet'}
            description={
              q
                ? 'Try a different search term.'
                : 'Once a customer with a recent visit posts a review, it appears here.'
            }
          />
        ) : (
          <div className="flex flex-col">
            {reviews.map((r) => (
              <ReviewCard key={r.txHash} review={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
