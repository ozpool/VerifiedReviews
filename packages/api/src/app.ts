import express, { type Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/businesses';
import { adminRouter } from './routes/admin';
import { sbtRouter } from './routes/sbt';
import { reviewRouter } from './routes/reviews';
import { errorHandler } from './middleware/error-handler';

export function buildApp(): Express {
  const app = express();

  const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.options('*', cors({ origin: allowedOrigin, credentials: true }));

  app.use(express.json());

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
