import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { computeContentHash } from '@vr/shared';

/**
 * End-to-end journey through the API seams: register → approve → owner login →
 * add staff → staff login → mint → ingest review → index (confirm) → search →
 * badge. Per-endpoint edge cases live in their own suites; this file proves the
 * pieces fit together across the whole flow.
 *
 * The on-chain gate itself (must hold a VisitProof, minted within 60 days, one
 * review per token) is enforced by ReviewRegistry and covered by the Hardhat
 * contract suite — the API trusts the chain and never re-implements that gate.
 */
process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';
process.env.BADGE_HMAC_KEY = 'badge-hmac-key-badge-hmac-key';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { indexOnce } = await import('../src/chain/indexer');
const { verifyBadge } = await import('../src/chain/badge');
const { setMintOrchestrator } = await import('../src/chain/orchestrator');
const { setMinterRegistrar } = await import('../src/chain/registrar');
const { AdminModel } = await import('../src/models/admin.model');
const { hashPassword } = await import('../src/auth/password');

const app = buildApp();
let mongo: MongoMemoryServer;
let adminToken: string;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const CUSTOMER = '0x3333333333333333333333333333333333333333';

// Stub the chain: approval registers a minter; minting returns a fake tx.
setMinterRegistrar({ async register() {} });
let mintN = 0;
setMintOrchestrator({
  async mint(_to: string, businessId: number) {
    mintN += 1;
    const seed = businessId * 1000 + mintN;
    return { tokenId: String(mintN), txHash: `0x${seed.toString(16).padStart(64, '0')}` };
  },
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await AdminModel.create({
    email: 'admin@e2e.test',
    passwordHash: await hashPassword('admin-pw-123'),
  });
  const res = await request(app)
    .post('/auth/admin/login')
    .send({ email: 'admin@e2e.test', password: 'admin-pw-123' })
    .expect(200);
  adminToken = res.body.token;
});

afterAll(async () => {
  setMintOrchestrator(null);
  setMinterRegistrar(null);
  await disconnectDb();
  await mongo.stop();
});

describe('full journey: visit → mint → review → badge', () => {
  it('carries a review from sign-up all the way to a signed badge', async () => {
    // 1. Business registers and the admin approves it (assigns id + minter).
    const created = await request(app)
      .post('/businesses')
      .send({
        slug: 'journey-cafe',
        name: 'Journey Cafe',
        category: 'Restaurant',
        city: 'Austin',
        ownerEmail: 'owner@journey.test',
        ownerPassword: 'owner-pw-123',
      })
      .expect(201);
    const approve = await request(app)
      .post(`/admin/businesses/${created.body.id}/approve`)
      .set(auth(adminToken))
      .expect(200);
    const businessId = approve.body.businessId as number;

    // 2. Owner logs in and adds a staff member.
    const ownerLogin = await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@journey.test', password: 'owner-pw-123' })
      .expect(200);
    await request(app)
      .post(`/businesses/${businessId}/staff`)
      .set(auth(ownerLogin.body.token))
      .send({ email: 'staff@journey.test', password: 'staff-pw-123' })
      .expect(201);

    // 3. Staff logs in (gets a business-scoped token + slug for the QR handoff).
    const staffLogin = await request(app)
      .post('/auth/staff/login')
      .send({ email: 'staff@journey.test', password: 'staff-pw-123' })
      .expect(200);
    expect(staffLogin.body.slug).toBe('journey-cafe');
    const staffToken = staffLogin.body.token as string;

    // 4. Staff mints the customer's VisitProof.
    const mint = await request(app)
      .post('/sbt/mint')
      .set(auth(staffToken))
      .send({ businessId, customerAddr: CUSTOMER })
      .expect(201);
    expect(mint.body.txHash).toMatch(/^0x[0-9a-f]{64}$/);

    // 5. Customer submits review text; the API stores it unconfirmed.
    const review = {
      businessId,
      reviewer: CUSTOMER,
      rating: 5,
      text: 'Outstanding coffee and friendly staff.',
      nonce: 'journey-nonce',
    };
    const contentHash = computeContentHash(review);
    const reviewTx = `0x${'cd'.repeat(32)}`;
    const ingest = await request(app)
      .post('/reviews')
      .send({ ...review, contentHash, txHash: reviewTx })
      .expect(202);
    expect(ingest.body.confirmed).toBe(false);

    // 6. The indexer sees the on-chain ReviewSubmitted event and confirms it.
    const confirmed = await indexOnce({
      fetchEvents: async () => [
        {
          businessId,
          reviewer: CUSTOMER,
          contentHash,
          rating: 5,
          txHash: reviewTx,
          logIndex: 0,
          blockNumber: 100,
        },
      ],
      toBlock: 100n,
    });
    expect(confirmed).toEqual({ confirmed: 1, lastBlock: 100 });

    // 7. The confirmed review now shows in search.
    const search = await request(app).get(`/reviews/search?businessId=${businessId}`).expect(200);
    expect(search.body).toHaveLength(1);
    expect(search.body[0].sentiment).toBe('positive');

    // 8. The badge counts it and is HMAC-verifiable.
    const badge = await request(app).get(`/badge/${businessId}`).expect(200);
    expect(badge.body).toMatchObject({ businessId, count: 1, avgRating: 5 });
    expect(verifyBadge(badge.body)).toBe(true);

    // A different business is isolated — none of this review's data leaks across.
    const otherBadge = await request(app)
      .get(`/badge/${businessId + 777}`)
      .expect(200);
    expect(otherBadge.body.count).toBe(0);
    const otherSearch = await request(app)
      .get(`/reviews/search?businessId=${businessId + 777}`)
      .expect(200);
    expect(otherSearch.body).toHaveLength(0);
  });
});

describe('journey-level integrity guards', () => {
  it('rejects review text that does not hash to its committed contentHash', async () => {
    await request(app)
      .post('/reviews')
      .send({
        businessId: 1,
        reviewer: CUSTOMER,
        rating: 4,
        text: 'tampered',
        nonce: 'n',
        contentHash: `0x${'00'.repeat(32)}`,
        txHash: `0x${'11'.repeat(32)}`,
      })
      .expect(400);
  });

  it('only staff/owner can mint — customers and anonymous callers cannot', async () => {
    const { signToken } = await import('../src/auth/jwt');
    const customer = signToken({ sub: CUSTOMER, role: 'customer' }, process.env.JWT_SECRET!);
    await request(app)
      .post('/sbt/mint')
      .send({ businessId: 1, customerAddr: CUSTOMER })
      .expect(401);
    await request(app)
      .post('/sbt/mint')
      .set(auth(customer))
      .send({ businessId: 1, customerAddr: CUSTOMER })
      .expect(403);
  });

  it('detects a tampered badge signature', async () => {
    const badge = await request(app).get('/badge/999').expect(200);
    expect(verifyBadge({ ...badge.body, count: badge.body.count + 50 })).toBe(false);
  });
});
