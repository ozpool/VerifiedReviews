'use client';

import { useReadContract } from 'wagmi';
import { reviewRegistryAbi, visitProofSbtAbi } from '@vr/shared';
import { registryAddress, sbtAddress, isSbtConfigured, isChainConfigured } from '@/lib/contracts';

/**
 * Eligibility states a customer can be in for a given business, derived purely
 * from on-chain reads (the same data the contract gate uses). This lets the UI
 * explain exactly what to do next instead of surprising the customer at submit.
 */
export type Eligibility =
  | 'idle' // not signed in / no address yet
  | 'loading'
  | 'unknown' // SBT address not configured, or a read failed — can't tell
  | 'no-proof' // no visit receipt: customer needs staff to mint one
  | 'too-old' // had a visit, but it's past the 60-day window
  | 'already-reviewed' // this visit's receipt was already used for a review
  | 'eligible'; // valid, unused receipt — ready to review

/** Mirror of ReviewRegistry.RECENCY_WINDOW (60 days) for client-side guidance.
 * The contract remains the real gate; this only drives the UI copy. */
const RECENCY_WINDOW_SEC = 60 * 24 * 60 * 60;

export interface VisitEligibility {
  state: Eligibility;
  tokenId?: bigint;
  visitedAt?: number; // unix seconds
}

/**
 * Read the customer's eligibility to review `businessId`:
 *  1. `latestVisitOf(address, businessId)` on the SBT → [tokenId, visitedAt].
 *  2. If a token exists, `reviewed(tokenId)` on the registry → already used?
 * The second read is gated on the first so we don't query `reviewed(0)`.
 */
export function useVisitEligibility(
  businessId: number | undefined,
  address: `0x${string}` | undefined,
): VisitEligibility {
  const enabled = Boolean(address) && businessId !== undefined && isSbtConfigured;

  const visit = useReadContract({
    address: isSbtConfigured ? sbtAddress() : undefined,
    abi: visitProofSbtAbi,
    functionName: 'latestVisitOf',
    args: address && businessId !== undefined ? [address, BigInt(businessId)] : undefined,
    // Poll so the page flips to "verified" within seconds of staff minting — the
    // customer never has to reload. Also refetch when they return to the tab.
    query: { enabled, refetchInterval: 4000, refetchOnWindowFocus: true },
  });

  const tokenId = visit.data?.[0];
  const visitedAt = visit.data ? Number(visit.data[1]) : undefined;
  const hasProof = tokenId !== undefined && tokenId > 0n;

  const reviewedRead = useReadContract({
    address: isChainConfigured ? registryAddress() : undefined,
    abi: reviewRegistryAbi,
    functionName: 'reviewed',
    args: hasProof ? [tokenId] : undefined,
    query: { enabled: enabled && hasProof, refetchInterval: 4000 },
  });

  if (!address || businessId === undefined) return { state: 'idle' };
  if (!isSbtConfigured) return { state: 'unknown' };
  if (visit.isLoading) return { state: 'loading' };
  if (visit.isError || !visit.data) return { state: 'unknown' };

  if (!hasProof) return { state: 'no-proof', visitedAt };

  const ageSec = Math.floor(Date.now() / 1000) - (visitedAt ?? 0);
  if (ageSec > RECENCY_WINDOW_SEC) return { state: 'too-old', tokenId, visitedAt };

  if (reviewedRead.isLoading) return { state: 'loading', tokenId, visitedAt };
  if (reviewedRead.data === true) return { state: 'already-reviewed', tokenId, visitedAt };

  return { state: 'eligible', tokenId, visitedAt };
}
