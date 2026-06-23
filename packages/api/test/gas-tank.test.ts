import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { signToken } = await import('../src/auth/jwt');
const { setMintOrchestrator } = await import('../src/chain/orchestrator');
const { setMinterRegistrar } = await import('../src/chain/registrar');
const { setGasTank, createGasTank } = await import('../src/chain/gas-tank');
const { MintModel } = await import('../src/models/mint.model');

setMinterRegistrar({ async register() {} });

const JWT_SECRET = process.env.JWT_SECRET;
const app = buildApp();
let mongo: MongoMemoryServer;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const adminToken = signToken({ sub: 'admin1', role: 'admin' }, JWT_SECRET);
const CUSTOMER = '0x2222222222222222222222222222222222222222';

function fakeOrchestrator() {
  let n = 0;
  return {
    async mint(_to: string, businessId: number) {
      n += 1;
      const seed = businessId * 7000 + n;
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
  setGasTank(null);
  await disconnectDb();
  await mongo.stop();
});

afterEach(() => {
  setMintOrchestrator(null);
  setGasTank(null);
});

describe('createGasTank', () => {
  it('is a no-op when no gas-tank key is configured', async () => {
    const tank = createGasTank();
    const result = await tank.topUp(CUSTOMER);
    expect(result.skipped).toBe(true);
  });
});

describe('mint funds the customer gas best-effort', () => {
  it('tops up the minted customer address', async () => {
    const bizId = await approvedBusiness('gt-a', 'gt-a@cafe.test');
    const staff = signToken({ sub: 'staff-gt-a', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());

    const topped: string[] = [];
    setGasTank({
      async topUp(to) {
        topped.push(to);
        return { skipped: false, txHash: '0xfeed' };
      },
    });

    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER })
      .expect(201);

    expect(topped).toEqual([CUSTOMER]);
  });

  it('still mints (and writes the audit row) when the top-up throws', async () => {
    const bizId = await approvedBusiness('gt-b', 'gt-b@cafe.test');
    const staff = signToken({ sub: 'staff-gt-b', role: 'staff', businessId: bizId }, JWT_SECRET);
    setMintOrchestrator(fakeOrchestrator());
    setGasTank({
      async topUp() {
        throw new Error('tank empty');
      },
    });

    await request(app)
      .post('/sbt/mint')
      .set(auth(staff))
      .send({ businessId: bizId, customerAddr: CUSTOMER })
      .expect(201);

    expect(await MintModel.countDocuments({ businessId: bizId })).toBe(1);
  });
});
