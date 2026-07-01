import { RatingStars } from './RatingStars';
import { txUrl, shortHex } from '@/lib/explorer';

/**
 * Optimistic, session-local preview of a review the customer just submitted.
 * It stands in for the real review card until the indexer confirms the tx and
 * the confirmed list picks it up — nobody else ever sees this version.
 */
export function PendingReviewCard({
  rating,
  text,
  txHash,
}: {
  rating: number;
  text: string;
  txHash: string;
}) {
  return (
    <article className="border-b border-border py-6 first:pt-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-mono text-xs font-semibold text-accent mt-0.5"
        >
          {'…'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <RatingStars rating={rating} size="sm" />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
              Pending confirmation
            </span>
          </div>

          <p className="text-[15px] leading-relaxed text-ink/90 mb-3">{text}</p>

          <a
            href={txUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-light transition-colors"
          >
            View transaction {shortHex(txHash, 8, 6)} ↗
          </a>
        </div>
      </div>
    </article>
  );
}
