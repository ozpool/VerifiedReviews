import { encodeAbiParameters, keccak256, type Hex } from 'viem';
import type { ReviewContent } from './schemas/review';

/**
 * The canonical content commitment for a review. This is the *single source of
 * truth* both sides depend on: the web app computes it to put on-chain when the
 * customer submits, and the API recomputes it to verify ingested text matches
 * the on-chain `contentHash` (the hash-mismatch check). Any divergence in
 * encoding here would silently break that verification, so it lives in @vr/shared.
 *
 * keccak256 (the EVM hash) over the ABI-encoded tuple gives a deterministic,
 * length-safe commitment — ABI encoding length-prefixes the strings, so no two
 * distinct (text, nonce) pairs can collide by concatenation.
 */
export function computeContentHash(content: ReviewContent): Hex {
  const encoded = encodeAbiParameters(
    [
      { type: 'uint256' },
      { type: 'address' },
      { type: 'uint8' },
      { type: 'string' },
      { type: 'string' },
    ],
    [
      BigInt(content.businessId),
      content.reviewer as Hex,
      content.rating,
      content.text,
      content.nonce,
    ],
  );
  return keccak256(encoded);
}
