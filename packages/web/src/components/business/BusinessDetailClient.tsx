'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBusiness, fetchBadge, fetchReviews, ApiError } from '@/lib/api';
import { RatingStars } from './RatingStars';
import { VerifiedStamp } from './VerifiedStamp';
import { ReviewCard } from './ReviewCard';
import { BusinessPattern } from './BusinessPattern';
import { Mascot } from './Mascot';
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
      {/* Identity hero: this business's generative pattern with its mascot
          wandering along the bottom while you read. */}
      <div className="relative -mt-2 h-32 sm:h-40 rounded-lg overflow-hidden border border-border">
        <BusinessPattern slug={business.slug} className="absolute inset-0 h-full w-full" />
        <Mascot
          slug={business.slug}
          className="absolute bottom-1 left-3 [--wander:clamp(0px,60vw,520px)]"
        />
      </div>

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

      {/* Avg rating hero */}
      <div className="border-y border-border py-7 flex flex-wrap items-center gap-x-10 gap-y-6">
        {/* Big number + stars */}
        <div className="flex items-end gap-4">
          <span className="font-display text-6xl font-bold tabular-nums leading-none text-ink">
            {badge ? badge.avgRating.toFixed(1) : '—'}
          </span>
          <div className="flex flex-col gap-1.5 pb-1">
            <RatingStars rating={badge?.avgRating ?? 0} />
            <span className="text-xs text-muted">out of 5</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-12 bg-border" aria-hidden="true" />

        {/* Verified count stamp */}
        <VerifiedStamp count={badge?.count ?? 0} />

        {/* CTA — pushed to the right */}
        <Link
          href={`/b/${business.slug}/write`}
          className="ml-auto inline-flex items-center gap-2 bg-accent text-paper px-5 py-2.5 rounded text-sm font-medium tracking-wide hover:bg-accent-light transition-colors"
        >
          Write a review
        </Link>
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
            {reviews.map((r, i) => (
              <ReviewCard key={r.txHash} review={r} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
