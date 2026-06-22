/**
 * Block-explorer link helpers. VerifiedReviews targets a single chain (Arbitrum
 * Sepolia), so the explorer base is a constant — every review's tx hash links out
 * to Arbiscan, which is what makes "verified" independently checkable by anyone.
 */
const ARBISCAN_BASE = 'https://sepolia.arbiscan.io';

export function txUrl(hash: string): string {
  return `${ARBISCAN_BASE}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${ARBISCAN_BASE}/address/${address}`;
}

/** Shorten a 0x address/hash for display: 0x1234…abcd. */
export function shortHex(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
