import type { Review } from './api';

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

/** Tally a business's reviews by sentiment bucket for the dashboard. */
export function summarizeSentiment(reviews: Review[]): SentimentBreakdown {
  const out: SentimentBreakdown = { positive: 0, neutral: 0, negative: 0, total: reviews.length };
  for (const r of reviews) out[r.sentiment] += 1;
  return out;
}

/** Percentage (0–100, rounded) of `part` out of `total`; 0 when total is 0. */
export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
