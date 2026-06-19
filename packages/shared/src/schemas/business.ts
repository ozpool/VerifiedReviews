import { z } from 'zod';

/** Business signup payload. Approved by an admin before a minter is provisioned. */
export const businessSignupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
  category: z.string().trim().min(2).max(60),
  city: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000).optional(),
  websiteUrl: z.string().url().optional(),
});

export type BusinessSignup = z.infer<typeof businessSignupSchema>;
