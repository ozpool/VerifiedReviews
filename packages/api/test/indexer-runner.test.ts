import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { computeContentHash } from '@vr/shared';
import type { PublicClient } from 'viem';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.MONGO_URI = 'mongodb://unused';

const { connectDb, disconnectDb } = await import('../src/db');
const { ingestReviewText } = await import('../src/services/review.service');
const { ReviewModel } = await import('../src/models/review.model');
const { runIndexerTick, startReviewIndexer } = await import('../src/chain/indexer-runner');
const { setCheckpoint } = await import('../src/models/checkpoint.model');

let mongo: MongoMemoryServer;
const REVIEWER = '0x2222222222222222222222222222222222222222';
const TXHASH = `0x${'cd'.repeat(32)}`;
const content = { businessId: 1, reviewer: REVIEWER, rating: 5, text: 'Lovely place.', nonce: 'n1' };

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await ReviewModel.deleteMany({});
  await setCheckpoint('reviewRegistry', 0);
});

describe('review indexer runner', () => {
  it('is disabled (returns null) when the chain is not configured', () => {
    delete process.env.REGISTRY_ADDRESS;
    delete process.env.RPC_URL;
    delete process.env.INDEXER_RPC_URL;
    expect(startReviewIndexer()).toBeNull();
  });

  it('reads the chain head and confirms an ingested review', async () => {
    const hash = computeContentHash(content);
    await ingestReviewText({ ...content, contentHash: hash, txHash: TXHASH });

    const fakeClient = { getBlockNumber: async () => 100n } as unknown as PublicClient;
    const fetchEvents = async () => [
      { businessId: 1, reviewer: REVIEWER, contentHash: hash, rating: 5, txHash: TXHASH, logIndex: 0, blockNumber: 100 },
    ];

    const res = await runIndexerTick(fakeClient, fetchEvents);
    expect(res).toEqual({ confirmed: 1, lastBlock: 100 });
    expect(await ReviewModel.countDocuments({ confirmed: true })).toBe(1);
  });
});
