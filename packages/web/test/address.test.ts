import { describe, it, expect } from 'vitest';
import { isEvmAddress } from '@/lib/address';

describe('isEvmAddress', () => {
  it('accepts a 0x-prefixed 20-byte address (trimming whitespace)', () => {
    expect(isEvmAddress('0x' + 'a'.repeat(40))).toBe(true);
    expect(isEvmAddress('  0x' + '1'.repeat(40) + '  ')).toBe(true);
  });

  it('rejects wrong length, missing prefix, and non-hex', () => {
    expect(isEvmAddress('0x' + 'a'.repeat(39))).toBe(false);
    expect(isEvmAddress('a'.repeat(40))).toBe(false);
    expect(isEvmAddress('0x' + 'g'.repeat(40))).toBe(false);
    expect(isEvmAddress('')).toBe(false);
  });
});
