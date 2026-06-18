import { z } from 'zod';
import { businessIdSchema, bytes32Schema, evmAddressSchema, starRatingSchema } from './common';

/**
 * The review content a customer writes. The `text` is hashed together with the
 * reviewer address and a nonce to produce the on-chain content commitment, so
 * these fields are exactly what the hash must be reproducible from.
 */
export const reviewContentSchema = z.object({
  businessId: businessIdSchema,
  reviewer: evmAddressSchema,
  rating: starRatingSchema,
  text: z.string().trim().min(1, 'review cannot be empty').max(5000),
  nonce: z.string().min(1).max(120),
});

/**
 * What the indexer ingests into Mongo after the on-chain tx confirms. The
 * `contentHash` must match keccak256 of the content; the API verifies this
 * before insert (the hash-mismatch check in PR #9).
 */
export const reviewIngestSchema = reviewContentSchema.extend({
  contentHash: bytes32Schema,
  txHash: bytes32Schema,
});

export type ReviewContent = z.infer<typeof reviewContentSchema>;
export type ReviewIngest = z.infer<typeof reviewIngestSchema>;
