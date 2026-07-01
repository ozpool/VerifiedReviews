import mongoose from 'mongoose';

/** Connect Mongoose to the given URI. Throws if the connection fails.
 *
 * `mongoose.connect` resolves once the socket is up, but schema indexes
 * (including `unique: true` ones, e.g. business slug / owner email) build in
 * the background afterwards. A request that lands in that window can insert
 * a duplicate before the constraint exists to reject it. Waiting for every
 * registered model to finish its index build closes that race. */
export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.connection.models).map((model) => model.init()));
}

/** Cleanly close the Mongoose connection (used on shutdown and in tests). */
export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True when the connection is live (readyState 1). Used by the readiness probe. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
