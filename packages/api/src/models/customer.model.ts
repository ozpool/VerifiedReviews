import mongoose, { type Model } from 'mongoose';
const { Schema, model, models } = mongoose;

/**
 * Links a Privy social identity (stable DID) to the wallet address it controls,
 * so a customer's reviews follow them across devices and logins. Off-chain only —
 * the chain never sees the social identity, keeping reviews pseudonymous.
 */
export interface CustomerDoc {
  privyUserId: string;
  address: string;
}

const customerSchema = new Schema<CustomerDoc>(
  {
    privyUserId: { type: String, required: true, unique: true },
    address: { type: String, required: true, lowercase: true, trim: true, index: true },
  },
  { timestamps: true },
);

export const CustomerModel =
  (models.Customer as Model<CustomerDoc>) ?? model<CustomerDoc>('Customer', customerSchema);
