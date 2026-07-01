import { describe, it, expect, beforeEach } from 'vitest';
import { savePendingReview, getPendingReview, clearPendingReview } from '@/lib/pendingReview';

describe('pendingReview', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when nothing is stored for a business', () => {
    expect(getPendingReview(1)).toBeNull();
  });

  it('round-trips a saved review', () => {
    savePendingReview({
      businessId: 1,
      reviewer: '0xabc',
      rating: 4,
      text: 'Great visit',
      txHash: '0xdead',
    });
    expect(getPendingReview(1)).toEqual({
      businessId: 1,
      reviewer: '0xabc',
      rating: 4,
      text: 'Great visit',
      txHash: '0xdead',
    });
  });

  it('keeps different businesses separate', () => {
    savePendingReview({ businessId: 1, reviewer: '0xabc', rating: 5, text: 'A', txHash: '0x1' });
    savePendingReview({ businessId: 2, reviewer: '0xabc', rating: 3, text: 'B', txHash: '0x2' });
    expect(getPendingReview(1)?.txHash).toBe('0x1');
    expect(getPendingReview(2)?.txHash).toBe('0x2');
  });

  it('clears a stored review', () => {
    savePendingReview({
      businessId: 1,
      reviewer: '0xabc',
      rating: 4,
      text: 'Great',
      txHash: '0xdead',
    });
    clearPendingReview(1);
    expect(getPendingReview(1)).toBeNull();
  });

  it('ignores corrupted stored JSON instead of throwing', () => {
    sessionStorage.setItem('vr:pending-review:1', 'not json');
    expect(getPendingReview(1)).toBeNull();
  });
});
