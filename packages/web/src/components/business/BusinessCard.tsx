import Link from 'next/link';
import type { Badge, PublicBusiness } from '@/lib/api';
import { identityFor } from '@/lib/identity';
import { RatingStars } from './RatingStars';
import { VerifiedStamp } from './VerifiedStamp';
import { BusinessPattern } from './BusinessPattern';
import { MascotFigure } from './mascots';

/**
 * A business in the browse grid. The badge (verified count + average) loads
 * separately, so it's optional — the card renders immediately and fills in its
 * stats when they arrive. Each card carries the business's generative identity:
 * its pattern banner, a vibe tag, and a mascot that peeks up on hover.
 */
export function BusinessCard({ business, badge }: { business: PublicBusiness; badge?: Badge }) {
  const id = identityFor(business.slug);
  return (
    <Link
      href={`/b/${business.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-border rounded bg-paper transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {/* Generative identity banner — unique to this business. The pattern lifts
          and the mascot peeks up on hover. */}
      <div className="relative h-16 w-full overflow-hidden border-b border-border">
        <BusinessPattern
          identity={id}
          className="absolute inset-0 h-full w-full transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-3 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0.5 group-hover:opacity-100"
          style={{ color: id.ink }}
        >
          <MascotFigure kind={id.mascot} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-ink group-hover:text-accent transition-colors">
              {business.name}
            </h3>
            <p className="mt-0.5 text-xs uppercase tracking-widest text-muted">
              {business.category} · {business.city}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted/80">
              {id.vibe.join(' · ')}
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
              <span className="tabular-nums font-medium text-ink">
                {badge.avgRating.toFixed(1)}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted">No verified reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
