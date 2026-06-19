import { describe, expect, it } from 'vitest';
import { computeContentHash } from '../src/hash';
import type { ReviewContent } from '../src/schemas/review';

const base: ReviewContent = {
  businessId: 1,
  reviewer: '0x1111111111111111111111111111111111111111',
  rating: 5,
  text: 'Great coffee and fast service.',
  nonce: 'abc-123',
};

describe('computeContentHash', () => {
  it('is a 0x-prefixed 32-byte hash', () => {
    expect(computeContentHash(base)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('is deterministic for identical content', () => {
    expect(computeContentHash(base)).toBe(computeContentHash({ ...base }));
  });

  it('changes when any field changes', () => {
    const h = computeContentHash(base);
    expect(computeContentHash({ ...base, rating: 4 })).not.toBe(h);
    expect(computeContentHash({ ...base, text: 'Great coffee and fast service!' })).not.toBe(h);
    expect(computeContentHash({ ...base, nonce: 'abc-124' })).not.toBe(h);
    expect(computeContentHash({ ...base, businessId: 2 })).not.toBe(h);
  });

  it('does not collide when text/nonce boundaries shift (length-safe encoding)', () => {
    const a = computeContentHash({ ...base, text: 'ab', nonce: 'c' });
    const b = computeContentHash({ ...base, text: 'a', nonce: 'bc' });
    expect(a).not.toBe(b);
  });
});
