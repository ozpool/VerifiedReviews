import mongoose, { type Model, type Types } from 'mongoose';
const { Schema, model, models } = mongoose;

export type FlagStatus = 'open' | 'dismissed' | 'actioned';

/**
 * A spam/abuse report against a stored review. Flagging is a moderation signal
 * only — it never touches the chain. An admin resolves each flag: `dismissed`
 * (the review is fine) or `actioned` (the review was hidden from search).
 */
export interface FlagDoc {
  review: Types.ObjectId;
  reason: string;
  status: FlagStatus;
}

const flagSchema = new Schema<FlagDoc>(
  {
    review: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['open', 'dismissed', 'actioned'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true },
);

export const FlagModel = (models.Flag as Model<FlagDoc>) ?? model<FlagDoc>('Flag', flagSchema);
