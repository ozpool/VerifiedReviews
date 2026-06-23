import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SiweMessage } from 'siwe';
import { privateKeyToAccount } from 'viem/accounts';

// Config is read at request time, so set env before importing app code paths.
process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.MONGO_URI = 'mongodb://unused';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { AdminModel } = await import('../src/models/admin.model');
const { BusinessModel } = await import('../src/models/business.model');
const { StaffModel } = await import('../src/models/staff.model');
const { hashPassword } = await import('../src/auth/password');
const { signToken, verifyToken } = await import('../src/auth/jwt');
const { requireAuth, requireRole } = await import('../src/middleware/auth');
const { errorHandler } = await import('../src/middleware/error-handler');

const JWT_SECRET = process.env.JWT_SECRET;
// Hardhat account #0 — a well-known test key.
const account = privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
);

const app = buildApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

async function signedSiwe(nonce: string, overrides: { domain?: string; chainId?: number } = {}) {
  const message = new SiweMessage({
    domain: overrides.domain ?? 'localhost',
    address: account.address,
    statement: 'Sign in to VerifiedReviews',
    uri: 'http://localhost',
    version: '1',
    chainId: overrides.chainId ?? 421614,
    nonce,
    issuedAt: new Date().toISOString(),
  }).prepareMessage();
  const signature = await account.signMessage({ message });
  return { message, signature };
}

describe('SIWE login', () => {
  it('issues a customer JWT for a valid signed message', async () => {
    const { body } = await request(app).get('/auth/nonce').expect(200);
    const { message, signature } = await signedSiwe(body.nonce);

    const res = await request(app).post('/auth/siwe').send({ message, signature }).expect(200);
    expect(res.body.address).toBe(account.address);

    const claims = verifyToken(res.body.token, JWT_SECRET);
    expect(claims.role).toBe('customer');
    expect(claims.sub).toBe(account.address);
  });

  it('rejects a replayed nonce (consumed on first use)', async () => {
    const { body } = await request(app).get('/auth/nonce').expect(200);
    const { message, signature } = await signedSiwe(body.nonce);

    await request(app).post('/auth/siwe').send({ message, signature }).expect(200);
    // Same message again → nonce already consumed.
    await request(app).post('/auth/siwe').send({ message, signature }).expect(401);
  });

  it('rejects an unknown nonce', async () => {
    const { message, signature } = await signedSiwe('neverissuednonce123456');
    await request(app).post('/auth/siwe').send({ message, signature }).expect(401);
  });

  it('rejects a message bound to a different domain', async () => {
    const { body } = await request(app).get('/auth/nonce').expect(200);
    const { message, signature } = await signedSiwe(body.nonce, { domain: 'evil.site' });
    await request(app).post('/auth/siwe').send({ message, signature }).expect(401);
  });

  it('rejects a message for the wrong chainId', async () => {
    const { body } = await request(app).get('/auth/nonce').expect(200);
    const { message, signature } = await signedSiwe(body.nonce, { chainId: 1 });
    await request(app).post('/auth/siwe').send({ message, signature }).expect(401);
  });
});

describe('admin login', () => {
  beforeAll(async () => {
    await AdminModel.create({
      email: 'admin@vr.test',
      passwordHash: await hashPassword('s3cret-pw'),
    });
  });

  it('issues an admin JWT for correct credentials', async () => {
    const res = await request(app)
      .post('/auth/admin/login')
      .send({ email: 'admin@vr.test', password: 's3cret-pw' })
      .expect(200);
    expect(verifyToken(res.body.token, JWT_SECRET).role).toBe('admin');
  });

  it('rejects a wrong password', async () => {
    await request(app)
      .post('/auth/admin/login')
      .send({ email: 'admin@vr.test', password: 'wrong' })
      .expect(401);
  });

  it('rejects a 400 on a malformed body', async () => {
    await request(app).post('/auth/admin/login').send({ email: 'not-an-email' }).expect(400);
  });
});

describe('business + staff login (401 vs 403)', () => {
  beforeAll(async () => {
    await BusinessModel.create({
      slug: 'approved-co',
      name: 'Approved Co',
      category: 'Cafe',
      city: 'Austin',
      ownerEmail: 'owner@vr.test',
      ownerPasswordHash: await hashPassword('owner-pw-123'),
      status: 'approved',
      businessId: 101,
    });
    await BusinessModel.create({
      slug: 'pending-co',
      name: 'Pending Co',
      category: 'Cafe',
      city: 'Austin',
      ownerEmail: 'pending@vr.test',
      ownerPasswordHash: await hashPassword('pending-pw-123'),
      status: 'pending',
    });
    await StaffModel.create({
      business: (await BusinessModel.findOne({ businessId: 101 }))!._id,
      businessId: 101,
      email: 'deactivated@vr.test',
      passwordHash: await hashPassword('staff-pw-123'),
      active: false,
    });
  });

  it('logs in an approved owner with the correct password', async () => {
    const res = await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@vr.test', password: 'owner-pw-123' })
      .expect(200);
    expect(res.body.businessId).toBe(101);
    expect(verifyToken(res.body.token, JWT_SECRET).role).toBe('owner');
  });

  it('rejects a wrong owner password with 401', async () => {
    await request(app)
      .post('/auth/business/login')
      .send({ email: 'owner@vr.test', password: 'nope' })
      .expect(401);
  });

  it('rejects an unknown owner email with 401', async () => {
    await request(app)
      .post('/auth/business/login')
      .send({ email: 'ghost@vr.test', password: 'whatever' })
      .expect(401);
  });

  it('returns 403 (not 401) for a correct password on a not-yet-approved business', async () => {
    const res = await request(app)
      .post('/auth/business/login')
      .send({ email: 'pending@vr.test', password: 'pending-pw-123' })
      .expect(403);
    expect(res.body.message).toMatch(/awaiting admin approval/i);
  });

  it('returns 403 for a correct password on a deactivated staff account', async () => {
    const res = await request(app)
      .post('/auth/staff/login')
      .send({ email: 'deactivated@vr.test', password: 'staff-pw-123' })
      .expect(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('requireAuth + requireRole', () => {
  // Throwaway app exercising the real middleware.
  const guarded = express();
  guarded.get('/me', requireAuth, (req, res) => res.json(req.user));
  guarded.get('/admin-only', requireAuth, requireRole('admin'), (_req, res) =>
    res.json({ ok: true }),
  );
  guarded.use(errorHandler);

  const customerToken = signToken({ sub: account.address, role: 'customer' }, JWT_SECRET);

  it('allows a valid token', async () => {
    const res = await request(guarded)
      .get('/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(res.body.role).toBe('customer');
  });

  it('rejects a missing token', async () => {
    await request(guarded).get('/me').expect(401);
  });

  it('rejects a tampered token', async () => {
    await request(guarded).get('/me').set('Authorization', `Bearer ${customerToken}x`).expect(401);
  });

  it('rejects an expired token', async () => {
    const expired = signToken({ sub: account.address, role: 'customer' }, JWT_SECRET, '-1s');
    await request(guarded).get('/me').set('Authorization', `Bearer ${expired}`).expect(401);
  });

  it('forbids a customer from an admin-only route', async () => {
    await request(guarded)
      .get('/admin-only')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });
});
