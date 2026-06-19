import { describe, expect, it } from 'vitest';
import {
  businessSignupSchema,
  bytes32Schema,
  evmAddressSchema,
  isSupportedChainId,
  mintRequestSchema,
  parseEnv,
  resolveAddresses,
  reviewContentSchema,
  starRatingSchema,
  ARBITRUM_SEPOLIA_CHAIN_ID,
} from '../src/index';
import { z } from 'zod';

const VALID_ADDR = '0x1234567890abcdefABCDEF1234567890aBcDef12';
const VALID_HASH = '0x' + 'a'.repeat(64);

describe('evmAddressSchema', () => {
  it('accepts a well-formed address', () => {
    expect(evmAddressSchema.safeParse(VALID_ADDR).success).toBe(true);
  });

  it.each([
    ['missing 0x prefix', '1234567890abcdef1234567890abcdef12345678'],
    ['too short', '0x1234'],
    ['too long', VALID_ADDR + 'ab'],
    ['non-hex chars', '0x' + 'z'.repeat(40)],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(evmAddressSchema.safeParse(value).success).toBe(false);
  });
});

describe('bytes32Schema', () => {
  it('accepts a 32-byte hash', () => {
    expect(bytes32Schema.safeParse(VALID_HASH).success).toBe(true);
  });

  it('rejects a 20-byte address as a hash', () => {
    expect(bytes32Schema.safeParse(VALID_ADDR).success).toBe(false);
  });

  it('rejects a 31-byte hash (off-by-one)', () => {
    expect(bytes32Schema.safeParse('0x' + 'a'.repeat(62)).success).toBe(false);
  });
});

describe('starRatingSchema', () => {
  it.each([1, 2, 3, 4, 5])('accepts %i', (n) => {
    expect(starRatingSchema.safeParse(n).success).toBe(true);
  });

  it.each([0, 6, -1, 2.5, Number.NaN])('rejects %s', (n) => {
    expect(starRatingSchema.safeParse(n).success).toBe(false);
  });
});

describe('reviewContentSchema', () => {
  const base = {
    businessId: 1,
    reviewer: VALID_ADDR,
    rating: 5,
    text: 'Great pasta, friendly staff.',
    nonce: 'abc123',
  };

  it('accepts a complete review', () => {
    expect(reviewContentSchema.safeParse(base).success).toBe(true);
  });

  it('trims and rejects whitespace-only text', () => {
    expect(reviewContentSchema.safeParse({ ...base, text: '   ' }).success).toBe(false);
  });

  it('rejects text over 5000 chars', () => {
    expect(reviewContentSchema.safeParse({ ...base, text: 'x'.repeat(5001) }).success).toBe(false);
  });

  it('rejects an out-of-range rating', () => {
    expect(reviewContentSchema.safeParse({ ...base, rating: 7 }).success).toBe(false);
  });

  it('rejects an invalid reviewer address', () => {
    expect(reviewContentSchema.safeParse({ ...base, reviewer: '0xnope' }).success).toBe(false);
  });
});

describe('businessSignupSchema', () => {
  const base = { name: 'Pasta Place', slug: 'pasta-place', category: 'Restaurant', city: 'Austin' };

  it('accepts a minimal valid signup', () => {
    expect(businessSignupSchema.safeParse(base).success).toBe(true);
  });

  it('accepts optional description and websiteUrl', () => {
    const result = businessSignupSchema.safeParse({
      ...base,
      description: 'Cozy Italian spot.',
      websiteUrl: 'https://pastaplace.example',
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['non-kebab slug', { ...base, slug: 'Pasta Place' }],
    ['name too short', { ...base, name: 'P' }],
    ['invalid website url', { ...base, websiteUrl: 'not-a-url' }],
  ])('rejects %s', (_label, value) => {
    expect(businessSignupSchema.safeParse(value).success).toBe(false);
  });
});

describe('mintRequestSchema', () => {
  it('accepts a valid mint request', () => {
    expect(mintRequestSchema.safeParse({ businessId: 3, customerAddr: VALID_ADDR }).success).toBe(
      true,
    );
  });

  it('rejects a non-positive businessId', () => {
    expect(mintRequestSchema.safeParse({ businessId: 0, customerAddr: VALID_ADDR }).success).toBe(
      false,
    );
  });
});

describe('address registry', () => {
  it('resolves a valid pair of addresses', () => {
    expect(resolveAddresses({ sbt: VALID_ADDR, registry: VALID_ADDR })).toEqual({
      sbt: VALID_ADDR,
      registry: VALID_ADDR,
    });
  });

  it('throws on a malformed address', () => {
    expect(() => resolveAddresses({ sbt: '0xbad', registry: VALID_ADDR })).toThrow();
  });

  it('recognizes Arbitrum Sepolia and rejects mainnet', () => {
    expect(isSupportedChainId(ARBITRUM_SEPOLIA_CHAIN_ID)).toBe(true);
    expect(isSupportedChainId(1)).toBe(false);
  });
});

describe('parseEnv', () => {
  const schema = z.object({ PORT: z.coerce.number().int().positive() });

  it('parses and coerces a valid source', () => {
    expect(parseEnv(schema, { PORT: '8080' })).toEqual({ PORT: 8080 });
  });

  it('throws a readable error when a var is missing', () => {
    expect(() => parseEnv(schema, {})).toThrow(/Invalid environment configuration/);
  });
});
