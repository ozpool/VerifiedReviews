import type { Review } from '@/lib/api';
import { RatingStars } from './RatingStars';
import { txUrl, shortHex } from '@/lib/explorer';

/**
 * A single confirmed review. Every card links to its on-chain tx on Arbiscan —
 * that link is the whole point: anyone can independently verify the review was
 * gated by a real visit, with no need to trust this site.
 */
export function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="border-b border-border py-5 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <RatingStars rating={review.rating} size="sm" />
          <span className="font-mono text-xs text-muted">{shortHex(review.reviewer)}</span>
        </div>
        <time className="text-xs text-muted shrink-0" dateTime={review.createdAt}>
          {date}
        </time>
      </div>

      <p className="mt-2.5 text-[15px] leading-relaxed text-ink/90">{review.text}</p>

      <a
        href={txUrl(review.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-light transition-colors"
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
    </article>
  );
}
