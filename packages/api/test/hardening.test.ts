import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';

const app = buildApp();

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS allow-list', () => {
  it('reflects an allow-listed origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('does not reflect an unknown origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('request body limit', () => {
  it('rejects an oversized JSON body with 413', async () => {
    const res = await request(app)
      .post('/auth/business/login')
      .set('Content-Type', 'application/json')
      .send({ blob: 'a'.repeat(70_000) }); // > 64kb limit
    expect(res.status).toBe(413);
  });
});

describe('config production hardening', () => {
  const base = { MONGO_URI: 'mongodb://x', JWT_SECRET: 'a'.repeat(16) };

  it('boots in development with defaults', () => {
    expect(() => loadConfig({ ...base })).not.toThrow();
  });

  it('fails a production boot without BADGE_HMAC_KEY', () => {
    expect(() =>
      loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGIN: 'https://app.example' }),
    ).toThrow(/BADGE_HMAC_KEY/);
  });

  it('fails a production boot when CORS_ORIGIN is left as the dev default', () => {
    expect(() =>
      loadConfig({ ...base, NODE_ENV: 'production', BADGE_HMAC_KEY: 'k'.repeat(16) }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('boots in production when both are set', () => {
    expect(() =>
      loadConfig({
        ...base,
        NODE_ENV: 'production',
        BADGE_HMAC_KEY: 'k'.repeat(16),
        CORS_ORIGIN: 'https://app.example',
      }),
    ).not.toThrow();
  });
});
