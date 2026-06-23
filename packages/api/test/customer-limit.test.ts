import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';
// Keep the per-business limit out of the way so we isolate the per-customer cap.
process.env.MINT_RATE_MAX = '100';
process.env.CUSTOMER_MINT_DAILY_MAX = '2';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { signToken } = await import('../src/auth/jwt');
const { setMintOrchestrator } = await import('../src/chain/orchestrator');
const { setMinterRegistrar } = await import('../src/chain/registrar');

setMinterRegistrar({ async register() {} });

const JWT_SECRET = process.env.JWT_SECRET;
const app = buildApp();
let mongo: MongoMemoryServer;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const adminToken = signToken({ sub: 'admin1', role: 'admin' }, JWT_SECRET);
const CUSTOMER_A = '0xAAAA000000000000000000000000000000000001';
const CUSTOMER_B = '0xBBBB000000000000000000000000000000000002';

function fakeOrchestrator() {
  let n = 0;
  return {
    async mint(_to: string, businessId: number) {
      n += 1;
      const seed = businessId * 9000 + n;
      return { tokenId: String(n), txHash: `0x${seed.toString(16).padStart(64, '0')}` };
    },
  };
}

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

describe('per-customer visit cap (2 per 24h)', () => {
  it('allows 2 mints to a customer, refuses the 3rd', async () => {
    const bizId = await approvedBusiness('cl-a', 'cl-a@cafe.test');
    const staff = signToken({ sub: 'staff-cl-a', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());
    const body = { businessId: bizId, customerAddr: CUSTOMER_A };

    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(201);
    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(201);
    await request(app).post('/sbt/mint').set(auth(staff)).send(body).expect(429);
  });

  it('counts per customer — a different customer is unaffected', async () => {
    const bizId = await approvedBusiness('cl-b', 'cl-b@cafe.test');
    const staff = signToken({ sub: 'staff-cl-b', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());

    // Customer A hits the cap…
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A })
      .expect(201);
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A })
      .expect(201);
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A })
      .expect(429);
    // …customer B still mints fine.
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_B })
      .expect(201);
  });

  it('is case-insensitive on the customer address', async () => {
    const bizId = await approvedBusiness('cl-c', 'cl-c@cafe.test');
    const staff = signToken({ sub: 'staff-cl-c', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());

    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A.toLowerCase() })
      .expect(201);
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A.toUpperCase().replace('0X', '0x') })
      .expect(201);
    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER_A })
      .expect(429);
  });
});
