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

async function signedSiwe(nonce: string) {
  const message = new SiweMessage({
    domain: 'localhost',
    address: account.address,
    statement: 'Sign in to VerifiedReviews',
    uri: 'http://localhost',
    version: '1',
    chainId: 421614,
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
});

describe('admin login', () => {
  beforeAll(async () => {
    await AdminModel.create({ email: 'admin@vr.test', passwordHash: await hashPassword('s3cret-pw') });
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
    await request(guarded)
      .get('/me')
      .set('Authorization', `Bearer ${customerToken}x`)
      .expect(401);
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
