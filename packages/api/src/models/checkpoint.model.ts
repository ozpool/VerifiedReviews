import { Schema, model, models, type Model } from 'mongoose';

/** The last block the indexer has processed for a given contract, so a restart
 * resumes instead of re-scanning (or worse, missing) history. */
export interface CheckpointDoc {
  _id: string;
  lastBlock: number;
}

const checkpointSchema = new Schema<CheckpointDoc>({
  _id: { type: String, required: true },
  lastBlock: { type: Number, required: true, default: 0 },
});

const CheckpointModel =
  (models.Checkpoint as Model<CheckpointDoc>) ??
  model<CheckpointDoc>('Checkpoint', checkpointSchema);

export async function getCheckpoint(name: string): Promise<number> {
  const doc = await CheckpointModel.findById(name).lean();
  return doc?.lastBlock ?? 0;
}

export async function setCheckpoint(name: string, lastBlock: number): Promise<void> {
  await CheckpointModel.findByIdAndUpdate(name, { lastBlock }, { upsert: true });
}
