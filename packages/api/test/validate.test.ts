import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateBody } from '../src/middleware/validate';
import { errorHandler } from '../src/middleware/error-handler';
import { AppError } from '../src/errors';

// A throwaway app exercising the real middleware in isolation.
function makeApp() {
  const app = express();
  app.use(express.json());
  app.post('/echo', validateBody(z.object({ name: z.string().min(2) })), (req, res) => {
    res.json(req.body);
  });
  app.get('/boom', () => {
    throw new AppError(418, 'teapot', { hint: 'short and stout' });
  });
  app.use(errorHandler);
  return app;
}

describe('validateBody + errorHandler', () => {
  const app = makeApp();

  it('passes a valid body through', async () => {
    const res = await request(app).post('/echo').send({ name: 'Pasta Place' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Pasta Place' });
  });

  it('returns 400 with issues on an invalid body', async () => {
    const res = await request(app).post('/echo').send({ name: 'P' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(Array.isArray(res.body.issues)).toBe(true);
  });

  it('maps an AppError to its status code and details', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(418);
    expect(res.body).toMatchObject({ message: 'teapot', details: { hint: 'short and stout' } });
  });
});
