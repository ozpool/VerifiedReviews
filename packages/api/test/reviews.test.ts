import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { computeContentHash } from '@vr/shared';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.BADGE_HMAC_KEY = 'badge-hmac-key-badge-hmac-key';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { indexOnce } = await import('../src/chain/indexer');
const { verifyBadge } = await import('../src/chain/badge');
const { ReviewModel } = await import('../src/models/review.model');
const CheckpointMod = await import('../src/models/checkpoint.model');

const app = buildApp();
let mongo: MongoMemoryServer;

const REVIEWER = '0x2222222222222222222222222222222222222222';
const TXHASH = `0x${'ab'.repeat(32)}`;

const content = (over: Record<string, unknown> = {}) => ({
  businessId: 1,
  reviewer: REVIEWER,
  rating: 5,
  text: 'Excellent service, would visit again.',
  nonce: 'nonce-1',
  ...over,
});

const ingestBody = (over: Record<string, unknown> = {}) => {
  const c = content(over);
  return { ...c, contentHash: computeContentHash(c), txHash: TXHASH };
};

/** Synthetic on-chain event matching an ingest body. */
const eventFor = (over: Record<string, unknown> = {}, logIndex = 0, block = 100n) => {
  const c = content(over);
  return [
    {
      businessId: c.businessId,
      reviewer: c.reviewer,
      contentHash: computeContentHash(c),
      rating: c.rating,
      txHash: TXHASH,
      logIndex,
      blockNumber: Number(block),
    },
  ];
};

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
  await CheckpointMod.setCheckpoint('reviewRegistry', 0);
});

describe('POST /reviews (ingest + hash verify)', () => {
  it('stores a review whose text matches its contentHash', async () => {
    const res = await request(app).post('/reviews').send(ingestBody()).expect(202);
    expect(res.body.confirmed).toBe(false);
  });

  it('rejects a review whose contentHash does not match the text', async () => {
    const bad = { ...ingestBody(), contentHash: `0x${'00'.repeat(32)}` };
    await request(app).post('/reviews').send(bad).expect(400);
  });
});

describe('indexer (checkpointing + replay idempotency)', () => {
  it('confirms an ingested review, then is a no-op on replay', async () => {
    await request(app).post('/reviews').send(ingestBody()).expect(202);

    const first = await indexOnce({ fetchEvents: async () => eventFor(), toBlock: 100n });
    expect(first).toEqual({ confirmed: 1, lastBlock: 100 });

    // Same event seen again in a later range: already confirmed → counts nothing.
    const second = await indexOnce({ fetchEvents: async () => eventFor(), toBlock: 200n });
    expect(second.confirmed).toBe(0);
    expect(await ReviewModel.countDocuments({ confirmed: true })).toBe(1);
  });

  it('does not rescan blocks at or below the checkpoint', async () => {
    await indexOnce({ fetchEvents: async () => eventFor(), toBlock: 100n });
    let called = false;
    const res = await indexOnce({
      fetchEvents: async () => {
        called = true;
        return [];
      },
      toBlock: 50n,
    });
    expect(called).toBe(false);
    expect(res.lastBlock).toBe(100);
  });
});

describe('search + badge', () => {
  beforeEach(async () => {
    await request(app).post('/reviews').send(ingestBody()).expect(202);
    await indexOnce({ fetchEvents: async () => eventFor(), toBlock: 100n });
  });

  it('returns confirmed reviews from text search', async () => {
    const res = await request(app).get('/reviews/search?businessId=1&q=service').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].sentiment).toBe('positive');
  });

  it('serves a valid HMAC-signed badge', async () => {
    const res = await request(app).get('/badge/1').expect(200);
    expect(res.body).toMatchObject({ businessId: 1, count: 1, avgRating: 5 });
    expect(verifyBadge(res.body)).toBe(true);
  });

  it('rejects a tampered badge signature', async () => {
    const res = await request(app).get('/badge/1').expect(200);
    expect(verifyBadge({ ...res.body, count: res.body.count + 99 })).toBe(false);
  });
});
