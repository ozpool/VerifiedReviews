import { Router } from 'express';
import type { z } from 'zod';
import { mintRequestSchema } from '@vr/shared';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { forbidden } from '../errors';
import { requestMint } from '../services/mint.service';

export const sbtRouter = Router();

/**
 * Staff/owner mint a VisitProof to a customer wallet. Scope is enforced against
 * the token's own businessId (the mint target is in the body, not the URL), so
 * one business can never mint under another's id even with a valid token.
 */
sbtRouter.post(
  '/sbt/mint',
  requireAuth,
  requireRole('owner', 'staff'),
  validateBody(mintRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof mintRequestSchema>;
      const user = req.user!;
      if (!('businessId' in user) || user.businessId !== body.businessId) {
        throw forbidden('Token is not scoped to this business');
      }
      const mint = await requestMint({
        businessId: body.businessId,
        customerAddr: body.customerAddr,
        staffId: user.sub,
      });
      res.status(201).json({ tokenId: mint.tokenId, txHash: mint.txHash });
    } catch (err) {
      next(err);
    }
  },
);
