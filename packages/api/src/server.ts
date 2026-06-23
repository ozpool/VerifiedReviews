import 'dotenv/config';
import { buildApp } from './app';
import { loadConfig } from './config';
import { connectDb, disconnectDb } from './db';
import { startReviewIndexer } from './chain/indexer-runner';
import { startMinterRefiller } from './chain/minter-refill-runner';

/** Process entrypoint: validate config, connect the DB, listen, shut down cleanly. */
async function main() {
  const config = loadConfig();
  await connectDb(config.MONGO_URI);

  const app = buildApp();
  const server = app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT} (${config.NODE_ENV})`);
  });

  // Begin pulling ReviewSubmitted events into Mongo (no-op if chain unconfigured).
  const indexer = startReviewIndexer();
  // Keep business minters topped up with gas (no-op if treasury unconfigured).
  const minterRefiller = startMinterRefiller();

  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    indexer?.stop();
    minterRefiller?.stop();
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
