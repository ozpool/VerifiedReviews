import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/** Single-use SIWE login nonces. The TTL index expires them after 5 minutes. */
const nonceSchema = new Schema({
  value: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

export const NonceModel = model('Nonce', nonceSchema);
