import { describe, it, expect } from 'vitest';
import { safeHttpUrl } from '@/lib/url';
import { shortHex, txUrl } from '@/lib/explorer';
import { reviewErrorMessage } from '@/lib/reviewErrors';

describe('safeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(safeHttpUrl('https://example.com')).toBe('https://example.com/');
    expect(safeHttpUrl('http://x.io/path')).toBe('http://x.io/path');
  });

  it('rejects javascript:, data:, and garbage', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpUrl('data:text/html,<script>')).toBeUndefined();
    expect(safeHttpUrl('not a url')).toBeUndefined();
    expect(safeHttpUrl(undefined)).toBeUndefined();
  });
});

describe('explorer helpers', () => {
  it('shortens hex and builds a tx URL', () => {
    expect(shortHex('0x1234567890abcdef', 6, 4)).toBe('0x1234…cdef');
    expect(txUrl('0xabc')).toBe('https://sepolia.arbiscan.io/tx/0xabc');
  });
});

describe('reviewErrorMessage', () => {
  it('maps known contract reverts to friendly text', () => {
    expect(reviewErrorMessage(new Error('... NoVisitProof ...'))).toMatch(/visit receipt/i);
    expect(reviewErrorMessage(new Error('... VisitTooOld ...'))).toMatch(/60 days/i);
    expect(reviewErrorMessage(new Error('... AlreadyReviewed ...'))).toMatch(/already reviewed/i);
    expect(reviewErrorMessage(new Error('User rejected the request'))).toMatch(/cancelled/i);
  });

  it('falls back for unknown errors', () => {
    expect(reviewErrorMessage(new Error('boom'))).toMatch(/try again/i);
  });
});
