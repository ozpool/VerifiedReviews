import mongoose from 'mongoose';

/** Connect Mongoose to the given URI. Throws if the connection fails. */
export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

/** Cleanly close the Mongoose connection (used on shutdown and in tests). */
export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True when the connection is live (readyState 1). Used by the readiness probe. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
