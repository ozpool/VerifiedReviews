import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Must be set before dynamic import of app.
process.env.JWT_SECRET = 'test-secret-test-secret-0123456789';
process.env.APP_DOMAIN = 'localhost';
process.env.MONGO_URI = 'mongodb://unused';
process.env.MINTER_MNEMONIC = 'test test test test test test test test test test test junk';

const { buildApp } = await import('../src/app');
const { connectDb, disconnectDb } = await import('../src/db');
const { BusinessModel } = await import('../src/models/business.model');

const app = buildApp();
let mongo: MongoMemoryServer;

/** Minimal approved business seed — bypasses the approval flow (which does an on-chain call). */
const approvedBase = {
  ownerEmail: 'owner@example.test',
  ownerPasswordHash: '$2b$10$placeholder.hash.for.testing.only',
  status: 'approved' as const,
  businessId: 1,
  minterAddress: '0x0000000000000000000000000000000000000001',
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());

  await BusinessModel.create([
    {
      slug: 'pizza-palace',
      name: 'Pizza Palace',
      category: 'Restaurant',
      city: 'Austin',
      description: 'Best pizza in town',
      websiteUrl: 'https://pizza.example.com',
      ...approvedBase,
      ownerEmail: 'owner@pizza.test',
      businessId: 1,
      minterAddress: '0x0000000000000000000000000000000000000001',
    },
    {
      slug: 'sushi-spot',
      name: 'Sushi Spot',
      category: 'Restaurant',
      city: 'Dallas',
      ownerEmail: 'owner@sushi.test',
      ownerPasswordHash: '$2b$10$placeholder.hash.for.testing.only',
      status: 'approved',
      businessId: 2,
      minterAddress: '0x0000000000000000000000000000000000000002',
    },
    {
      slug: 'coffee-corner',
      name: 'Coffee Corner',
      category: 'Cafe',
      city: 'Austin',
      ownerEmail: 'owner@coffee.test',
      ownerPasswordHash: '$2b$10$placeholder.hash.for.testing.only',
      status: 'approved',
      businessId: 3,
      minterAddress: '0x0000000000000000000000000000000000000003',
    },
    {
      slug: 'pending-bistro',
      name: 'Pending Bistro',
      category: 'Restaurant',
      city: 'Austin',
      ownerEmail: 'owner@pending.test',
      ownerPasswordHash: '$2b$10$placeholder.hash.for.testing.only',
      status: 'pending',
    },
  ]);
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('GET /businesses', () => {
  it('returns only approved businesses', async () => {
    const res = await request(app).get('/businesses').expect(200);
    const slugs = res.body.map((b: { slug: string }) => b.slug);
    expect(slugs).toContain('pizza-palace');
    expect(slugs).toContain('sushi-spot');
    expect(slugs).toContain('coffee-corner');
    expect(slugs).not.toContain('pending-bistro');
  });

  it('returns results sorted by name', async () => {
    const res = await request(app).get('/businesses').expect(200);
    const names: string[] = res.body.map((b: { name: string }) => b.name);
    expect(names).toEqual([...names].sort());
  });

  it('filters by city (case-insensitive exact match)', async () => {
    const res = await request(app).get('/businesses?city=austin').expect(200);
    const slugs = res.body.map((b: { slug: string }) => b.slug);
    expect(slugs).toContain('pizza-palace');
    expect(slugs).toContain('coffee-corner');
    expect(slugs).not.toContain('sushi-spot');
  });

  it('filters by category (case-insensitive exact match)', async () => {
    const res = await request(app).get('/businesses?category=cafe').expect(200);
    const slugs = res.body.map((b: { slug: string }) => b.slug);
    expect(slugs).toContain('coffee-corner');
    expect(slugs).not.toContain('pizza-palace');
    expect(slugs).not.toContain('sushi-spot');
  });

  it('filters by q (name substring, case-insensitive)', async () => {
    const res = await request(app).get('/businesses?q=pizza').expect(200);
    const slugs = res.body.map((b: { slug: string }) => b.slug);
    expect(slugs).toContain('pizza-palace');
    expect(slugs).not.toContain('sushi-spot');
  });

  it('can combine city + category filters', async () => {
    const res = await request(app).get('/businesses?city=Austin&category=Restaurant').expect(200);
    const slugs = res.body.map((b: { slug: string }) => b.slug);
    expect(slugs).toContain('pizza-palace');
    expect(slugs).not.toContain('sushi-spot'); // wrong city
    expect(slugs).not.toContain('coffee-corner'); // wrong category
  });

  it('returns empty array when no approved businesses match', async () => {
    const res = await request(app).get('/businesses?city=nowhere').expect(200);
    expect(res.body).toEqual([]);
  });

  it('does not leak private fields', async () => {
    const res = await request(app).get('/businesses').expect(200);
    for (const biz of res.body) {
      expect(biz).not.toHaveProperty('ownerEmail');
      expect(biz).not.toHaveProperty('ownerPasswordHash');
      expect(biz).not.toHaveProperty('minterAddress');
    }
  });
});

describe('GET /businesses/:slug', () => {
  it('returns an approved business by slug', async () => {
    const res = await request(app).get('/businesses/pizza-palace').expect(200);
    expect(res.body.slug).toBe('pizza-palace');
    expect(res.body.name).toBe('Pizza Palace');
    expect(res.body.category).toBe('Restaurant');
    expect(res.body.city).toBe('Austin');
    expect(res.body.description).toBe('Best pizza in town');
    expect(res.body.websiteUrl).toBe('https://pizza.example.com');
  });

  it('does not return ownerEmail, ownerPasswordHash, or minterAddress', async () => {
    const res = await request(app).get('/businesses/pizza-palace').expect(200);
    expect(res.body).not.toHaveProperty('ownerEmail');
    expect(res.body).not.toHaveProperty('ownerPasswordHash');
    expect(res.body).not.toHaveProperty('minterAddress');
  });

  it('returns 404 for a pending business', async () => {
    await request(app).get('/businesses/pending-bistro').expect(404);
  });

  it('returns 404 for an unknown slug', async () => {
    await request(app).get('/businesses/does-not-exist').expect(404);
  });
});
