import { z } from 'zod';
import { businessIdSchema, evmAddressSchema } from './common';

/** Staff-initiated request to mint a VisitProof SBT to a customer wallet. */
export const mintRequestSchema = z.object({
  businessId: businessIdSchema,
  customerAddr: evmAddressSchema,
});

export type MintRequest = z.infer<typeof mintRequestSchema>;
