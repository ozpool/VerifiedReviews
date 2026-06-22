import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import type { BusinessStatus } from '../models/business.model';
import * as businesses from '../services/business.service';
import { listOpenFlags, resolveFlag } from '../services/flag.service';

export const adminRouter = Router();

/** Admin-only: the open spam/abuse flag queue, newest first. */
adminRouter.get('/admin/flags', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    res.json(await listOpenFlags());
  } catch (err) {
    next(err);
  }
});

const resolveSchema = z.object({ action: z.enum(['dismiss', 'hide']) });

/** Admin-only: resolve a flag — dismiss (false alarm) or hide (drop the review). */
adminRouter.post(
  '/admin/flags/:id/resolve',
  requireAuth,
  requireRole('admin'),
  validateBody(resolveSchema),
  async (req, res, next) => {
    try {
      const { action } = req.body as z.infer<typeof resolveSchema>;
      const flag = await resolveFlag(req.params.id!, action);
      res.json({ id: flag.id, status: flag.status });
    } catch (err) {
      next(err);
    }
  },
);

/** Admin-only: list businesses, optionally filtered by ?status=pending|approved|rejected. */
adminRouter.get('/admin/businesses', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.query.status;
    const list = await businesses.listBusinesses(
      typeof status === 'string' ? (status as BusinessStatus) : undefined,
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/** Admin-only: approve a pending business (assigns id + provisions minter). */
adminRouter.post(
  '/admin/businesses/:id/approve',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const business = await businesses.approveBusiness(req.params.id!);
      res.json({
        id: business.id,
        status: business.status,
        businessId: business.businessId,
        minterAddress: business.minterAddress,
      });
    } catch (err) {
      next(err);
    }
  },
);
