import 'dotenv/config';
import { loadConfig } from '../config';
import { connectDb, disconnectDb } from '../db';
import { AdminModel } from '../models/admin.model';
import { hashPassword } from '../auth/password';

/**
 * Seed (or update) a platform admin from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 * Run: ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=... pnpm -F @vr/api seed:admin
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to seed an admin');
  }

  await connectDb(loadConfig().MONGO_URI);
  await AdminModel.findOneAndUpdate(
    { email },
    { email, passwordHash: await hashPassword(password) },
    { upsert: true },
  );
  console.log(`Seeded admin ${email}`);
  await disconnectDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
