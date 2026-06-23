import mongoose from 'mongoose';
import { FlagModel } from '../models/flag.model';
import { ReviewModel } from '../models/review.model';
import { badRequest, notFound } from '../errors';

/** Public: report a review. Verifies the review exists, then records an open flag. */
export async function flagReview(reviewId: string, reason: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) throw badRequest('invalid review id');
  const review = await ReviewModel.findById(reviewId).select('_id').lean();
  if (!review) throw notFound('Review not found');
  return FlagModel.create({ review: reviewId, reason });
}

/** Admin: open flags, newest first, with a preview of the flagged review. */
export function listOpenFlags() {
  return FlagModel.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('review', 'businessId reviewer rating text sentiment hidden')
    .lean();
}

/**
 * Admin: resolve a flag. `dismiss` closes it as a false alarm; `hide` also marks
 * the review hidden so search + badge counts drop it (the chain is untouched).
 */
export async function resolveFlag(flagId: string, action: 'dismiss' | 'hide') {
  if (!mongoose.Types.ObjectId.isValid(flagId)) throw badRequest('invalid flag id');
  const flag = await FlagModel.findById(flagId);
  if (!flag) throw notFound('Flag not found');
  if (action === 'hide') {
    await ReviewModel.findByIdAndUpdate(flag.review, { hidden: true });
    flag.status = 'actioned';
  } else {
    flag.status = 'dismissed';
  }
  await flag.save();
  return flag;
}
