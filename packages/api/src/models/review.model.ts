import { Schema, model, models, type Model } from 'mongoose';

export type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * A review's off-chain text plus the on-chain commitment that backs it. A review
 * is only `confirmed` once the indexer has matched it to a ReviewSubmitted event;
 * search and badge counts consider confirmed reviews only, so the chain stays the
 * source of truth (the API never invents a review).
 */
export interface ReviewDoc {
  businessId: number;
  reviewer: string;
  rating: number;
  text: string;
  nonce: string;
  contentHash: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  sentiment: Sentiment;
  confirmed: boolean;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    businessId: { type: Number, required: true, index: true },
    reviewer: { type: String, required: true, lowercase: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    nonce: { type: String, required: true },
    // The keccak256 commitment; unique so the same review can't be stored twice.
    contentHash: { type: String, required: true, unique: true },
    txHash: { type: String, default: '' },
    logIndex: { type: Number, default: -1 },
    blockNumber: { type: Number, default: 0 },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    confirmed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Full-text search over review bodies (the search endpoint).
reviewSchema.index({ text: 'text' });
// Replay idempotency: a given on-chain log can finalize exactly one review.
reviewSchema.index({ txHash: 1, logIndex: 1 }, { unique: true, partialFilterExpression: { confirmed: true } });

export const ReviewModel =
  (models.Review as Model<ReviewDoc>) ?? model<ReviewDoc>('Review', reviewSchema);
