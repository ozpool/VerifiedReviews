import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/businesses';
import { adminRouter } from './routes/admin';
import { sbtRouter } from './routes/sbt';
import { reviewRouter } from './routes/reviews';
import { errorHandler } from './middleware/error-handler';

export function buildApp(): Express {
  const app = express();

  // Don't advertise the framework, and set conservative security headers. The
  // API only ever returns JSON, so helmet's defaults (nosniff, frameguard,
  // no-referrer, etc.) are all safe and add no behavioural risk.
  app.disable('x-powered-by');
  app.use(helmet());

  // CORS allow-list. CORS_ORIGIN may be a comma-separated list; in dev it
  // defaults to the local web app. Unknown origins simply get no CORS headers
  // (the browser then blocks them) — we never reflect an arbitrary origin while
  // also sending credentials, which would be a vulnerability.
  const allowed = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
      // No Origin header = a non-browser client (curl, server-to-server) — allow.
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Cap request bodies. Reviews and auth payloads are tiny; this blocks a class
  // of memory-exhaustion abuse. Oversized bodies surface as a clean 413.
  app.use(express.json({ limit: '64kb' }));

  // A general per-IP rate limit across the whole API. The mint path keeps its
  // own tighter, per-business limit on top of this. Skipped under test so the
  // suite stays deterministic.
  if (process.env.NODE_ENV !== 'test') {
    const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
    const max = Number(process.env.RATE_LIMIT_MAX ?? 300);
    app.use(
      rateLimit({
        windowMs: windowSec * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  app.use(healthRouter);
  app.use(authRouter);
  app.use(businessRouter);
  app.use(adminRouter);
  app.use(sbtRouter);
  app.use(reviewRouter);

  // Error handler is mounted last so it catches everything above it.
  app.use(errorHandler);
  return app;
}
