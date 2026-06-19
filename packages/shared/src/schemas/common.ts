import { z } from 'zod';

/** A 0x-prefixed 20-byte EVM address (case-insensitive; not checksum-validated). */
export const evmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'must be a 0x-prefixed 20-byte address');

/** A 0x-prefixed 32-byte hash (e.g. a keccak256 content hash or a tx hash). */
export const bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'must be a 0x-prefixed 32-byte hash');

/** Star rating constrained to the integer range the UI and contract accept. */
export const starRatingSchema = z.number().int().min(1).max(5);

/**
 * On-chain business identifier. The contract type is `uint256`, but business
 * IDs are platform-assigned and sequential, so they always fit in a JS safe
 * integer — making the number<->uint256 conversion lossless. The explicit
 * `.max` guarantees that: any value past 2^53-1 is rejected loudly rather than
 * silently losing precision when handed to a uint256 argument.
 */
export const businessIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export type EvmAddress = z.infer<typeof evmAddressSchema>;
export type Bytes32 = z.infer<typeof bytes32Schema>;
export type StarRating = z.infer<typeof starRatingSchema>;
export type BusinessId = z.infer<typeof businessIdSchema>;
