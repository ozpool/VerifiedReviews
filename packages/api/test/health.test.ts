import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { buildApp } from '../src/app';
import { connectDb, disconnectDb } from '../src/db';

const app = buildApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('GET /health', () => {
  it('returns ok regardless of DB state', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('reports 503 while the DB is disconnected', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.db).toBe('disconnected');
  });

  it('reports 200 once the DB is connected', async () => {
    await connectDb(mongo.getUri());
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('connected');
  });
});
