import 'dotenv/config';
import { buildApp } from './app';
import { loadConfig } from './config';
import { connectDb, disconnectDb } from './db';

/** Process entrypoint: validate config, connect the DB, listen, shut down cleanly. */
async function main() {
  const config = loadConfig();
  await connectDb(config.MONGO_URI);

  const app = buildApp();
  const server = app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT} (${config.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDb();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
