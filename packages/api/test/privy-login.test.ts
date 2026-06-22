import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Config is read at request time, so set env before importing app code paths.
process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.MONGO_URI = 'mongodb://unused';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { verifyToken } = await import('../src/auth/jwt');
const { setPrivyVerifier } = await import('../src/auth/privy');
const { CustomerModel } = await import('../src/models/customer.model');

const JWT_SECRET = process.env.JWT_SECRET;
const ADDR = '0xAbC0000000000000000000000000000000000123';

const app = buildApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterEach(() => setPrivyVerifier(null));

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('Privy embedded-wallet login', () => {
  it('issues a customer JWT and links the identity for a valid token', async () => {
    setPrivyVerifier({
      verify: async () => ({ userId: 'did:privy:alice', address: ADDR }),
    });

    const res = await request(app).post('/auth/privy').send({ token: 'valid' }).expect(200);

    // Address is returned lowercased and the JWT is a customer session.
    expect(res.body.address).toBe(ADDR.toLowerCase());
    const claims = verifyToken(res.body.token, JWT_SECRET);
    expect(claims.role).toBe('customer');
    expect(claims.sub).toBe(ADDR.toLowerCase());

    // The social identity → address link is persisted.
    const linked = await CustomerModel.findOne({ privyUserId: 'did:privy:alice' });
    expect(linked?.address).toBe(ADDR.toLowerCase());
  });

  it('re-links the same identity to a new address (upsert, no duplicate)', async () => {
    const NEW = '0xdef0000000000000000000000000000000000999';
    setPrivyVerifier({ verify: async () => ({ userId: 'did:privy:bob', address: ADDR }) });
    await request(app).post('/auth/privy').send({ token: 'v1' }).expect(200);

    setPrivyVerifier({ verify: async () => ({ userId: 'did:privy:bob', address: NEW }) });
    const res = await request(app).post('/auth/privy').send({ token: 'v2' }).expect(200);

    expect(res.body.address).toBe(NEW.toLowerCase());
    expect(await CustomerModel.countDocuments({ privyUserId: 'did:privy:bob' })).toBe(1);
  });

  it('rejects an invalid token with 401 (never trusts the client)', async () => {
    setPrivyVerifier({
      verify: async () => {
        throw new Error('bad token');
      },
    });
    await request(app).post('/auth/privy').send({ token: 'forged' }).expect(401);
  });

  it('rejects a malformed body with 400', async () => {
    await request(app).post('/auth/privy').send({}).expect(400);
  });
});
