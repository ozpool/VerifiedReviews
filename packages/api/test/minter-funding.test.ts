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
const { setMinterRegistrar } = await import('../src/chain/registrar');
const { setMinterFunder, createMinterFunder } = await import('../src/chain/minter-funder');
const { runMinterRefillTick } = await import('../src/chain/minter-refill-runner');
const { deriveMinterAddress } = await import('../src/chain/minter');

setMinterRegistrar({ async register() {} });

const JWT_SECRET = process.env.JWT_SECRET;
const app = buildApp();
let mongo: MongoMemoryServer;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const adminToken = signToken({ sub: 'admin1', role: 'admin' }, JWT_SECRET);

/** Sign up a pending business; return its Mongo _id. */
async function signupBusiness(slug: string, ownerEmail: string): Promise<string> {
  const res = await request(app)
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
  return res.body.id as string;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  setMinterRegistrar(null);
  setMinterFunder(null);
  await disconnectDb();
  await mongo.stop();
});

afterEach(() => setMinterFunder(null));

describe('createMinterFunder', () => {
  it('is a no-op when no treasury key is configured', async () => {
    const funder = createMinterFunder();
    const result = await funder.fund('0x000000000000000000000000000000000000dEaD');
    expect(result.skipped).toBe(true);
  });
});

describe('B — auto-fund at approval', () => {
  it("funds the new business's minter address on approval", async () => {
    const id = await signupBusiness('mf-a', 'mf-a@cafe.test');
    const funded: string[] = [];
    setMinterFunder({
      async fund(addr) {
        funded.push(addr);
        return { skipped: false, txHash: '0xfund' };
      },
    });

    const res = await request(app)
      .post(`/admin/businesses/${id}/approve`)
      .set(auth(adminToken))
      .expect(200);

    expect(res.body.status).toBe('approved');
    expect(funded).toEqual([res.body.minterAddress]);
  });

  it('still approves when funding throws', async () => {
    const id = await signupBusiness('mf-b', 'mf-b@cafe.test');
    setMinterFunder({
      async fund() {
        throw new Error('treasury empty');
      },
    });

    await request(app).post(`/admin/businesses/${id}/approve`).set(auth(adminToken)).expect(200);
  });
});

describe('C — refill sweep', () => {
  it('tops up every approved minter the funder reports below threshold', async () => {
    // Two approved businesses exist from B's tests above; add one more.
    const id = await signupBusiness('mf-c', 'mf-c@cafe.test');
    setMinterFunder({
      async fund() {
        return { skipped: false, txHash: '0xrefill' };
      },
    });
    await request(app).post(`/admin/businesses/${id}/approve`).set(auth(adminToken)).expect(200);

    const swept: string[] = [];
    const funded = await runMinterRefillTick({
      async fund(addr) {
        swept.push(addr);
        return { skipped: false, txHash: '0xrefill' };
      },
    });

    // Every approved business was visited, and its minter address was derivable.
    expect(swept.length).toBeGreaterThanOrEqual(3);
    expect(funded).toBe(swept.length);
    expect(swept).toContain(deriveMinterAddress(1));
  });

  it('counts only minters that actually received funds (skips funded ones)', async () => {
    const funded = await runMinterRefillTick({
      async fund() {
        return { skipped: true, reason: 'already funded' };
      },
    });
    expect(funded).toBe(0);
  });
});
