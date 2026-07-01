const KEY_PREFIX = 'vr:pending-review:';

export interface PendingReview {
  businessId: number;
  reviewer: string;
  rating: number;
  text: string;
  txHash: string;
}

/**
 * Session-local echo of a review the customer just submitted, shown before the
 * indexer confirms it. Only the submitter's own browser ever sees this — it is
 * never sent anywhere, and it is superseded the moment the confirmed list from
 * the API contains a matching transaction (see `BusinessDetailClient`).
 */
export function savePendingReview(review: PendingReview): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${KEY_PREFIX}${review.businessId}`, JSON.stringify(review));
}

export function getPendingReview(businessId: number): PendingReview | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${KEY_PREFIX}${businessId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingReview;
  } catch {
    return null;
  }
}

export function clearPendingReview(businessId: number): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${KEY_PREFIX}${businessId}`);
}
