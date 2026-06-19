import mongoose, { type Model, type Types } from 'mongoose';
const { Schema, model, models } = mongoose;

export interface StaffDoc {
  business: Types.ObjectId;
  businessId: number;
  email: string;
  passwordHash: string;
  active: boolean;
}

const staffSchema = new Schema<StaffDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    businessId: { type: Number, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const StaffModel =
  (models.Staff as Model<StaffDoc>) ?? model<StaffDoc>('Staff', staffSchema);
