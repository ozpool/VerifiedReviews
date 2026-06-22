import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
// Well-known test mnemonic — fine for deriving deterministic test addresses.
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { signToken } = await import('../src/auth/jwt');
const { setMinterRegistrar } = await import('../src/chain/registrar');

// Record on-chain minter registrations instead of sending a real admin tx.
const registered: Array<{ businessId: number; minterAddr: string }> = [];
let registrarFails = false;
setMinterRegistrar({
  async register(businessId, minterAddr) {
    if (registrarFails) throw new Error('setBusinessMinter reverted');
    registered.push({ businessId, minterAddr });
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
const app = buildApp();
let mongo: MongoMemoryServer;

const adminToken = signToken({ sub: 'admin1', role: 'admin' }, JWT_SECRET);
const customerToken = signToken({ sub: '0xabc', role: 'customer' }, JWT_SECRET);
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const signupBody = (over: Record<string, unknown> = {}) => ({
  slug: 'pasta-place',
  name: 'Pasta Place',
  category: 'Restaurant',
  city: 'Austin',
  ownerEmail: 'owner@pasta.test',
  ownerPassword: 'super-secret',
  ...over,
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  setMinterRegistrar(null);
  await disconnectDb();
  await mongo.stop();
});

describe('business signup + approval', () => {
  let bizAId: string;

  it('creates a pending business', async () => {
    const res = await request(app).post('/businesses').send(signupBody()).expect(201);
    expect(res.body.status).toBe('pending');
    bizAId = res.body.id;
  });

  it('rejects a duplicate slug with 409', async () => {
    await request(app)
      .post('/businesses')
      .send(signupBody({ ownerEmail: 'other@pasta.test' }))
      .expect(409);
  });

  it('lists the pending business for an admin', async () => {
    const res = await request(app)
      .get('/admin/businesses?status=pending')
      .set(auth(adminToken))
      .expect(200);
    expect(res.body.some((b: { slug: string }) => b.slug === 'pasta-place')).toBe(true);
  });

  it('forbids a non-admin from listing businesses', async () => {
    await request(app).get('/admin/businesses').set(auth(customerToken)).expect(403);
  });

  it('approves the business, assigning an id and minter address', async () => {
    const res = await request(app)
      .post(`/admin/businesses/${bizAId}/approve`)
      .set(auth(adminToken))
      .expect(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.businessId).toBe(1);
    expect(res.body.minterAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    // The minter must have been authorized on-chain for this exact business.
    expect(registered).toContainEqual({ businessId: 1, minterAddr: res.body.minterAddress });
  });

  it('rejects re-approving an already-approved business', async () => {
    await request(app)
      .post(`/admin/businesses/${bizAId}/approve`)
      .set(auth(adminToken))
      .expect(409);
  });
});

describe('owner login + staff management', () => {
  let bizBId: string;
  let ownerBToken: string;
  let staffId: string;

  it('does not let an owner log in before approval', async () => {
    const res = await request(app)
      .post('/businesses')
      .send(signupBody({ slug: 'sushi-bar', ownerEmail: 'owner@sushi.test' }))
      .expect(201);
    bizBId = res.body.id;
    await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@sushi.test', password: 'super-secret' })
      .expect(401);
  });

  it('lets an owner log in once approved', async () => {
    await request(app)
      .post(`/admin/businesses/${bizBId}/approve`)
      .set(auth(adminToken))
      .expect(200);
    const res = await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@sushi.test', password: 'super-secret' })
      .expect(200);
    expect(res.body.businessId).toBe(2);
    ownerBToken = res.body.token;
  });

  it('lets the owner add staff to their own business, who can then log in', async () => {
    const created = await request(app)
      .post('/businesses/2/staff')
      .set(auth(ownerBToken))
      .send({ email: 'chef@sushi.test', password: 'staff-secret' })
      .expect(201);
    staffId = created.body.id;

    const login = await request(app)
      .post('/auth/staff/login')
      .send({ email: 'chef@sushi.test', password: 'staff-secret' })
      .expect(200);
    expect(login.body.businessId).toBe(2);
  });

  it("lists the owner's own active staff", async () => {
    const res = await request(app).get('/businesses/2/staff').set(auth(ownerBToken)).expect(200);
    expect(res.body.map((s: { email: string }) => s.email)).toContain('chef@sushi.test');
  });

  it('forbids listing staff of a different business', async () => {
    await request(app).get('/businesses/1/staff').set(auth(ownerBToken)).expect(403);
  });

  it('forbids an owner from adding staff to a different business', async () => {
    await request(app)
      .post('/businesses/1/staff')
      .set(auth(ownerBToken))
      .send({ email: 'intruder@sushi.test', password: 'staff-secret' })
      .expect(403);
  });

  it('rejects unauthenticated and wrong-role staff creation', async () => {
    await request(app)
      .post('/businesses/2/staff')
      .send({ email: 'x@sushi.test', password: 'staff-secret' })
      .expect(401);
    await request(app)
      .post('/businesses/2/staff')
      .set(auth(customerToken))
      .send({ email: 'y@sushi.test', password: 'staff-secret' })
      .expect(403);
  });

  it('lets the owner deactivate their staff', async () => {
    await request(app).delete(`/businesses/2/staff/${staffId}`).set(auth(ownerBToken)).expect(204);
  });
});

describe('approval requires on-chain minter registration', () => {
  it('does not approve when the on-chain registration fails', async () => {
    const created = await request(app)
      .post('/businesses')
      .send(signupBody({ slug: 'taco-stand', ownerEmail: 'owner@taco.test' }))
      .expect(201);

    registrarFails = true;
    await request(app)
      .post(`/admin/businesses/${created.body.id}/approve`)
      .set(auth(adminToken))
      .expect(502);
    registrarFails = false;

    // Still pending — the owner cannot log in until a real approval lands.
    await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@taco.test', password: 'super-secret' })
      .expect(401);
  });
});
