import { Router } from 'express';
import { isDbConnected } from '../db';

export const healthRouter = Router();

/** Liveness: the process is up and serving. */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/** Readiness: the process can serve traffic, i.e. the DB is connected. */
healthRouter.get('/ready', (_req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ready' : 'not-ready',
    db: connected ? 'connected' : 'disconnected',
  });
});
