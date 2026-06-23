import type { Review } from '@/lib/api';
import { RatingStars } from './RatingStars';
import { txUrl, shortHex } from '@/lib/explorer';

const SENTIMENT_STYLES: Record<Review['sentiment'], string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  neutral: 'bg-amber-50 text-amber-700 border-amber-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
};

const SENTIMENT_LABEL: Record<Review['sentiment'], string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Critical',
};

/** Avatar-style initial from a hex address — last 2 hex chars, uppercased. */
function reviewerInitial(addr: string) {
  return addr.slice(-2).toUpperCase();
}

export function ReviewCard({ review, index = 0 }: { review: Review; index?: number }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      className="border-b border-border py-6 first:pt-0 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        {/* Reviewer avatar */}
        <div
          aria-hidden="true"
          className="shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-mono text-xs font-semibold text-accent mt-0.5"
        >
          {reviewerInitial(review.reviewer)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: stars + sentiment + date */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <RatingStars rating={review.rating} size="sm" />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${SENTIMENT_STYLES[review.sentiment]}`}
            >
              {SENTIMENT_LABEL[review.sentiment]}
            </span>
            <time className="text-xs text-muted ml-auto shrink-0" dateTime={review.createdAt}>
              {date}
            </time>
          </div>

          {/* Review text */}
          <p className="text-[15px] leading-relaxed text-ink/90 mb-3">{review.text}</p>

          {/* Footer: reviewer address + on-chain link */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-mono text-[11px] text-muted/70">{shortHex(review.reviewer)}</span>
            <a
              href={txUrl(review.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-light transition-colors"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path
                  d="M4 10.5l4.5 4.5 7.5-9"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Verified on-chain
              <span className="font-mono text-muted">{shortHex(review.txHash, 8, 6)}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
