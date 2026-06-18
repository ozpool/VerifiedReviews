import { Router } from 'express';
import { z } from 'zod';
import { businessSignupSchema } from '@vr/shared';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireBusinessScope, requireRole } from '../middleware/auth';
import * as businesses from '../services/business.service';

export const businessRouter = Router();

const signupSchema = businessSignupSchema.extend({
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
});

/** Public: a business applies to join (lands in `pending`). */
businessRouter.post('/businesses', validateBody(signupSchema), async (req, res, next) => {
  try {
    const business = await businesses.createBusiness(req.body as z.infer<typeof signupSchema>);
    res.status(201).json({ id: business.id, slug: business.slug, status: business.status });
  } catch (err) {
    next(err);
  }
});

const staffSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

/** Owner-only: add a staff member to the owner's own business. */
businessRouter.post(
  '/businesses/:businessId/staff',
  requireAuth,
  requireRole('owner'),
  requireBusinessScope,
  validateBody(staffSchema),
  async (req, res, next) => {
    try {
      const staff = await businesses.addStaff(
        Number(req.params.businessId),
        req.body as z.infer<typeof staffSchema>,
      );
      res.status(201).json({ id: staff.id, email: staff.email });
    } catch (err) {
      next(err);
    }
  },
);

/** Owner-only: deactivate a staff member of the owner's own business. */
businessRouter.delete(
  '/businesses/:businessId/staff/:staffId',
  requireAuth,
  requireRole('owner'),
  requireBusinessScope,
  async (req, res, next) => {
    try {
      await businesses.removeStaff(Number(req.params.businessId), req.params.staffId!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
