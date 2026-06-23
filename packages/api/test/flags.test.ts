import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.MONGO_URI = 'mongodb://unused';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { AdminModel } = await import('../src/models/admin.model');
const { ReviewModel } = await import('../src/models/review.model');
const { hashPassword } = await import('../src/auth/password');

const app = buildApp();
let mongo: MongoMemoryServer;
let adminToken: string;
let reviewId: string;

const BIZ = 7;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());

  await AdminModel.create({ email: 'mod@vr.test', passwordHash: await hashPassword('mod-pw-123') });
  const res = await request(app)
    .post('/auth/admin/login')
    .send({ email: 'mod@vr.test', password: 'mod-pw-123' });
  adminToken = res.body.token;

  const review = await ReviewModel.create({
    businessId: BIZ,
    reviewer: '0x' + '1'.repeat(40),
    rating: 1,
    text: 'spammy nonsense buy now',
    nonce: 'n1',
    contentHash: '0x' + 'a'.repeat(64),
    confirmed: true,
    txHash: '0xdead',
    logIndex: 0,
    blockNumber: 1,
  });
  reviewId = review.id;
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('review flagging', () => {
  it('accepts a public flag with a reason (201)', async () => {
    const res = await request(app)
      .post(`/reviews/${reviewId}/flag`)
      .send({ reason: 'This is spam, not a real review.' })
      .expect(201);
    expect(res.body.status).toBe('open');
  });

  it('rejects a too-short reason (400)', async () => {
    await request(app).post(`/reviews/${reviewId}/flag`).send({ reason: 'x' }).expect(400);
  });

  it('rejects a flag on an unknown review (404)', async () => {
    const ghost = '0123456789abcdef01234567';
    await request(app).post(`/reviews/${ghost}/flag`).send({ reason: 'whatever spam' }).expect(404);
  });
});

describe('admin flag queue', () => {
  it('requires admin auth', async () => {
    await request(app).get('/admin/flags').expect(401);
  });

  it('lists open flags with the review preview', async () => {
    const res = await request(app)
      .get('/admin/flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].review.text).toMatch(/spammy/i);
  });

  it('hiding a flagged review drops it from search and closes the flag', async () => {
    const list = await request(app)
      .get('/admin/flags')
      .set('Authorization', `Bearer ${adminToken}`);
    const flagId = list.body[0]._id;

    await request(app)
      .post(`/admin/flags/${flagId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'hide' })
      .expect(200);

    // The review is now hidden — search must not return it.
    const search = await request(app).get(`/reviews/search?businessId=${BIZ}`).expect(200);
    expect(search.body).toHaveLength(0);
  });
});
