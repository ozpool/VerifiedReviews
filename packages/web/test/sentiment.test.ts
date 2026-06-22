import { describe, it, expect } from 'vitest';
import { summarizeSentiment, percent } from '@/lib/sentiment';
import type { Review } from '@/lib/api';

const review = (sentiment: Review['sentiment']): Review => ({
  businessId: 1,
  reviewer: '0x0',
  rating: 5,
  text: '',
  sentiment,
  txHash: '0x0',
  createdAt: '',
});

describe('summarizeSentiment', () => {
  it('tallies each bucket and the total', () => {
    const s = summarizeSentiment([
      review('positive'),
      review('positive'),
      review('neutral'),
      review('negative'),
    ]);
    expect(s).toEqual({ positive: 2, neutral: 1, negative: 1, total: 4 });
  });

  it('returns zeros for no reviews', () => {
    expect(summarizeSentiment([])).toEqual({ positive: 0, neutral: 0, negative: 0, total: 0 });
  });
});

describe('percent', () => {
  it('rounds and guards division by zero', () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });
});
