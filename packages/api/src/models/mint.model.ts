import mongoose, { type Model } from 'mongoose';
const { Schema, model, models } = mongoose;

/**
 * Audit record of one minted VisitProof. Written only after the on-chain tx
 * succeeds (a reverted mint leaves no row), so this collection doubles as the
 * mint history and the rate-limit window source.
 */
export interface MintDoc {
  businessId: number;
  customerAddr: string;
  staffId: string;
  tokenId: string;
  txHash: string;
}

const mintSchema = new Schema<MintDoc>(
  {
    businessId: { type: Number, required: true, index: true },
    customerAddr: { type: String, required: true, lowercase: true, trim: true },
    // The authenticated minter's token subject (staff or owner) for audit trail.
    staffId: { type: String, required: true },
    tokenId: { type: String, required: true },
    txHash: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const MintModel = (models.Mint as Model<MintDoc>) ?? model<MintDoc>('Mint', mintSchema);
