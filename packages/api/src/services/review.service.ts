import { computeContentHash, type ReviewIngest } from '@vr/shared';
import { ReviewModel, type Sentiment } from '../models/review.model';
import { signBadge, type SignedBadge } from '../chain/badge';
import { badRequest } from '../errors';

/** Rating-derived sentiment. Honest scope: this is a bucket of the star rating,
 * not NLP over the text — a richer model can replace it without touching callers. */
function sentimentFor(rating: number): Sentiment {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

/** On-chain ReviewSubmitted data the indexer hands us, plus the log coordinates. */
export interface OnChainReview {
  businessId: number;
  reviewer: string;
  contentHash: string;
  rating: number;
  txHash: string;
  logIndex: number;
  blockNumber: number;
}

/**
 * Store a customer's review text, rejecting it unless the text actually hashes to
 * the committed `contentHash`. This is the off-chain integrity half: we never
 * trust text whose hash we can't reproduce. Upserts by contentHash so a resend is
 * harmless. The review stays unconfirmed until the indexer sees its event.
 */
export async function ingestReviewText(ingest: ReviewIngest) {
  const recomputed = computeContentHash(ingest);
  if (recomputed.toLowerCase() !== ingest.contentHash.toLowerCase()) {
    throw badRequest('content hash does not match review text');
  }
  return ReviewModel.findOneAndUpdate(
    { contentHash: ingest.contentHash.toLowerCase() },
    {
      $set: {
        businessId: ingest.businessId,
        reviewer: ingest.reviewer.toLowerCase(),
        rating: ingest.rating,
        text: ingest.text,
        nonce: ingest.nonce,
        sentiment: sentimentFor(ingest.rating),
      },
      $setOnInsert: { contentHash: ingest.contentHash.toLowerCase(), confirmed: false },
    },
    { upsert: true, new: true },
  );
}

/**
 * Finalize a review against its on-chain event. The chain is the source of truth,
 * so we only confirm when the stored fields match the emitted ones. Idempotent:
 * a re-seen log (same txHash+logIndex) confirms nothing twice. Returns true only
 * on a fresh confirmation.
 */
export async function confirmEvent(event: OnChainReview): Promise<boolean> {
  const review = await ReviewModel.findOne({ contentHash: event.contentHash.toLowerCase() });
  if (!review) return false; // text not ingested yet; a later run will catch it
  if (review.confirmed) return false; // already finalized — replay no-op
  if (
    review.businessId !== event.businessId ||
    review.reviewer !== event.reviewer.toLowerCase() ||
    review.rating !== event.rating
  ) {
    return false; // on-chain commitment disagrees with stored text; don't confirm
  }
  review.set({
    confirmed: true,
    txHash: event.txHash,
    logIndex: event.logIndex,
    blockNumber: event.blockNumber,
  });
  await review.save();
  return true;
}

/** Confirmed reviews for a business, optionally full-text filtered. */
export function searchReviews(businessId: number, q?: string) {
  const filter: Record<string, unknown> = { businessId, confirmed: true, hidden: { $ne: true } };
  if (q) filter.$text = { $search: q };
  return ReviewModel.find(filter)
    .select('businessId reviewer rating text sentiment txHash createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

/** Aggregate + HMAC-sign a business's confirmed-review counts for the badge. */
export async function badgeFor(businessId: number): Promise<SignedBadge> {
  const reviews = await ReviewModel.find({ businessId, confirmed: true, hidden: { $ne: true } })
    .select('rating')
    .lean();
  const count = reviews.length;
  const avgRating = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 100) / 100
    : 0;
  return signBadge({ businessId, count, avgRating });
}
