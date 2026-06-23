import { describe, it, expect } from 'vitest';
import { identityFor, PATTERNS, MASCOTS } from '@/lib/identity';

describe('identityFor', () => {
  it('is deterministic — same slug yields the same identity', () => {
    expect(identityFor('corner-cafe')).toEqual(identityFor('corner-cafe'));
  });

  it('produces a hue in range and a valid pattern + mascot', () => {
    const id = identityFor('sushi-bar');
    expect(id.hue).toBeGreaterThanOrEqual(0);
    expect(id.hue).toBeLessThan(360);
    expect(PATTERNS).toContain(id.pattern);
    expect(MASCOTS).toContain(id.mascot);
    expect(id.ink).toMatch(/^hsl\(/);
  });

  it('differs across distinct slugs', () => {
    expect(identityFor('alpha').seed).not.toBe(identityFor('beta-bistro').seed);
  });

  it('handles an empty slug without throwing', () => {
    expect(() => identityFor('')).not.toThrow();
  });
});
