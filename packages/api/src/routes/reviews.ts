import { Router } from 'express';
import { z } from 'zod';
import { reviewIngestSchema } from '@vr/shared';
import { validateBody } from '../middleware/validate';
import { ingestReviewText, searchReviews, badgeFor } from '../services/review.service';
import { flagReview } from '../services/flag.service';
import { badRequest } from '../errors';

export const reviewRouter = Router();

const flagSchema = z.object({ reason: z.string().trim().min(3).max(500) });

/** Public: report a review for spam/abuse. Moderation signal only — never
 * affects the chain. An admin reviews each flag in the moderation queue. */
reviewRouter.post('/reviews/:id/flag', validateBody(flagSchema), async (req, res, next) => {
  try {
    const { reason } = req.body as z.infer<typeof flagSchema>;
    const flag = await flagReview(req.params.id!, reason);
    res.status(201).json({ id: flag.id, status: flag.status });
  } catch (err) {
    next(err);
  }
});

/** Public: a customer posts their review text + the on-chain commitment. The
 * service rejects any text whose hash doesn't match the committed contentHash. */
reviewRouter.post('/reviews', validateBody(reviewIngestSchema), async (req, res, next) => {
  try {
    const review = await ingestReviewText(req.body as z.infer<typeof reviewIngestSchema>);
    res.status(202).json({ contentHash: review.contentHash, confirmed: review.confirmed });
  } catch (err) {
    next(err);
  }
});

/** Public search over a business's confirmed reviews. */
reviewRouter.get('/reviews/search', async (req, res, next) => {
  try {
    const businessId = Number(req.query.businessId);
    if (!Number.isInteger(businessId) || businessId <= 0) {
      throw badRequest('businessId query param is required');
    }
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(await searchReviews(businessId, q));
  } catch (err) {
    next(err);
  }
});

/** Public, HMAC-signed badge counts for embedding on a business's own site. */
reviewRouter.get('/badge/:bizId', async (req, res, next) => {
  try {
    const businessId = Number(req.params.bizId);
    if (!Number.isInteger(businessId) || businessId <= 0) {
      throw badRequest('bizId must be a positive integer');
    }
    res.json(await badgeFor(businessId));
  } catch (err) {
    next(err);
  }
});
