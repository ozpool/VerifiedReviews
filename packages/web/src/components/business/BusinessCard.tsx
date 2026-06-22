import Link from 'next/link';
import type { Badge, PublicBusiness } from '@/lib/api';
import { RatingStars } from './RatingStars';
import { VerifiedStamp } from './VerifiedStamp';

/**
 * A business in the browse grid. The badge (verified count + average) loads
 * separately, so it's optional — the card renders immediately and fills in its
 * stats when they arrive.
 */
export function BusinessCard({ business, badge }: { business: PublicBusiness; badge?: Badge }) {
  return (
    <Link
      href={`/b/${business.slug}`}
      className="group flex flex-col gap-3 border border-border rounded bg-paper p-5 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-ink group-hover:text-accent transition-colors">
            {business.name}
          </h3>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted">
            {business.category} · {business.city}
          </p>
        </div>
        {badge && badge.count > 0 && <VerifiedStamp count={badge.count} className="shrink-0" />}
      </div>

      {business.description && (
        <p className="text-sm text-muted leading-relaxed line-clamp-2">{business.description}</p>
      )}

      <div className="mt-auto pt-2 flex items-center gap-2 text-sm">
        {badge && badge.count > 0 ? (
          <>
            <RatingStars rating={badge.avgRating} size="sm" />
            <span className="tabular-nums font-medium text-ink">{badge.avgRating.toFixed(1)}</span>
          </>
        ) : (
          <span className="text-xs text-muted">No verified reviews yet</span>
        )}
      </div>
    </Link>
  );
}
