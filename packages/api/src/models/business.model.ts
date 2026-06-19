import mongoose, { type Model } from 'mongoose';
const { Schema, model, models } = mongoose;

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

export interface BusinessDoc {
  slug: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  websiteUrl?: string;
  ownerEmail: string;
  ownerPasswordHash: string;
  status: BusinessStatus;
  businessId?: number;
  minterAddress?: string;
}

const businessSchema = new Schema<BusinessDoc>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    city: { type: String, required: true },
    description: { type: String },
    websiteUrl: { type: String },
    ownerEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerPasswordHash: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Assigned on approval; sparse so unapproved businesses don't collide on null.
    businessId: { type: Number, unique: true, sparse: true },
    minterAddress: { type: String },
  },
  { timestamps: true },
);

export const BusinessModel =
  (models.Business as Model<BusinessDoc>) ?? model<BusinessDoc>('Business', businessSchema);
