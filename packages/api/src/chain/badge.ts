import { createHmac, timingSafeEqual } from 'node:crypto';
import { loadConfig } from '../config';

export interface BadgeCounts {
  businessId: number;
  count: number;
  avgRating: number;
}

export interface SignedBadge extends BadgeCounts {
  signature: string;
}

/** Canonical string signed/verified — fixed field order so both sides agree. */
function payload(b: BadgeCounts): string {
  return `${b.businessId}:${b.count}:${b.avgRating}`;
}

/**
 * HMAC-sign the badge counts. An embedded badge is just a number on someone
 * else's page, so without a signature a business could inflate its own count;
 * the secret-keyed HMAC lets the badge host verify the figures came from us.
 */
export function signBadge(counts: BadgeCounts): SignedBadge {
  const { BADGE_HMAC_KEY } = loadConfig();
  if (!BADGE_HMAC_KEY) throw new Error('BADGE_HMAC_KEY is required to sign badges');
  const signature = createHmac('sha256', BADGE_HMAC_KEY).update(payload(counts)).digest('hex');
  return { ...counts, signature };
}

/** Constant-time verification of a signed badge. */
export function verifyBadge(badge: SignedBadge): boolean {
  const { BADGE_HMAC_KEY } = loadConfig();
  if (!BADGE_HMAC_KEY) return false;
  const expected = createHmac('sha256', BADGE_HMAC_KEY)
    .update(payload({ businessId: badge.businessId, count: badge.count, avgRating: badge.avgRating }))
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(badge.signature, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
