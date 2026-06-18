import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import type { BusinessStatus } from '../models/business.model';
import * as businesses from '../services/business.service';

export const adminRouter = Router();

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
