import { Schema, model } from 'mongoose';

/** Platform administrators who approve businesses. Seeded out-of-band. */
const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const AdminModel = model('Admin', adminSchema);
