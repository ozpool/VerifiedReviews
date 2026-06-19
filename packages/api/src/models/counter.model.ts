import { Schema, model, models, type Model } from 'mongoose';

interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel =
  (models.Counter as Model<CounterDoc>) ?? model<CounterDoc>('Counter', counterSchema);

/** Atomically increment and return the next value in a named sequence. */
export async function nextSequence(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return doc!.seq;
}
