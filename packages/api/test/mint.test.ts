import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';
// Small window so the rate-limit case is cheap to hit.
process.env.MINT_RATE_MAX = '2';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { signToken } = await import('../src/auth/jwt');
const { setMintOrchestrator } = await import('../src/chain/orchestrator');
const { setMinterRegistrar } = await import('../src/chain/registrar');
const { MintModel } = await import('../src/models/mint.model');

// Approval registers a minter on-chain; stub it so these mint tests can set up
// approved businesses without a real admin tx.
setMinterRegistrar({ async register() {} });

const JWT_SECRET = process.env.JWT_SECRET;
const app = buildApp();
let mongo: MongoMemoryServer;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const adminToken = signToken({ sub: 'admin1', role: 'admin' }, JWT_SECRET);
const CUSTOMER = '0x1111111111111111111111111111111111111111';

/** Deterministic fake: hands back a unique txHash per call so the audit unique
 * index never collides; throws when configured to simulate a revert. */
function fakeOrchestrator(opts: { revert?: boolean } = {}) {
  let n = 0;
  return {
    async mint(_to: string, businessId: number) {
      if (opts.revert) throw new Error('execution reverted');
      n += 1;
      // Fold businessId in so txHashes stay globally unique across tests (the
      // audit collection enforces a unique txHash index).
      const seed = businessId * 1000 + n;
      return { tokenId: String(n), txHash: `0x${seed.toString(16).padStart(64, '0')}` };
    },
  };
}

/** Sign up a business and approve it, returning its assigned numeric id. */
async function approvedBusiness(slug: string, ownerEmail: string): Promise<number> {
  const created = await request(app)
    .post('/businesses')
    .send({
      slug,
      name: slug,
      category: 'Restaurant',
      city: 'Austin',
      ownerEmail,
      ownerPassword: 'super-secret',
    })
    .expect(201);
  const res = await request(app)
    .post(`/admin/businesses/${created.body.id}/approve`)
    .set(auth(adminToken))
    .expect(200);
  return res.body.businessId as number;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  setMintOrchestrator(null);
  setMinterRegistrar(null);
  await disconnectDb();
  await mongo.stop();
});

afterEach(() => setMintOrchestrator(null));

describe('POST /sbt/mint', () => {
  it('mints and writes an audit row for in-scope staff', async () => {
    const bizId = await approvedBusiness('cafe-a', 'a@cafe.test');
    const staff = signToken({ sub: 'staff-a', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());

    const res = await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER })
      .expect(201);

    expect(res.body.tokenId).toBe('1');
    expect(res.body.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(await MintModel.countDocuments({ businessId: bizId })).toBe(1);
  });

  it('forbids minting under a business the token is not scoped to', async () => {
    const bizId = await approvedBusiness('cafe-b', 'b@cafe.test');
    const staff = signToken({ sub: 'staff-b', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());

    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId + 999, customerAddr: CUSTOMER })
      .expect(403);
  });

  it('rejects unauthenticated and customer-role callers', async () => {
    const customer = signToken({ sub: CUSTOMER, role: 'customer' }, JWT_SECRET);
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

  it('does not write an audit row when the tx reverts', async () => {
    const bizId = await approvedBusiness('cafe-c', 'c@cafe.test');
    const staff = signToken({ sub: 'staff-c', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator({ revert: true }));

    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER })
      .expect(502);

    expect(await MintModel.countDocuments({ businessId: bizId })).toBe(0);
  });

  it('rate-limits after MINT_RATE_MAX mints in the window', async () => {
    const bizId = await approvedBusiness('cafe-d', 'd@cafe.test');
    const staff = signToken({ sub: 'staff-d', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());
    const body = { businessId: bizId, customerAddr: CUSTOMER };

    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(201);
    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(201);
    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(429);
  });
});

describe('GET /sbt/mints', () => {
  it("returns the staff's own business mints, newest first", async () => {
    const bizId = await approvedBusiness('cafe-log', 'log@cafe.test');
    const staff = signToken({ sub: 'staff-log', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER })
      .expect(201);

    const res = await request(app).get('/sbt/mints').set(auth(staff)).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerAddr).toBe(CUSTOMER);
    expect(res.body[0].txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("never leaks another business's mints", async () => {
    const otherId = await approvedBusiness('cafe-other', 'other@cafe.test');
    const staff = signToken({ sub: 'staff-o', role: 'staff', businessId: otherId }, JWT_SECRET);
    // cafe-other has minted nothing of its own, so the log is empty.
    const res = await request(app).get('/sbt/mints').set(auth(staff)).expect(200);
    expect(res.body).toEqual([]);
  });

  it('rejects unauthenticated and customer-role callers', async () => {
    const customer = signToken({ sub: CUSTOMER, role: 'customer' }, JWT_SECRET);
    await request(app).get('/sbt/mints').expect(401);
    await request(app).get('/sbt/mints').set(auth(customer)).expect(403);
  });
});
