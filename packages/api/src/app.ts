import express, { type Express } from 'express';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/businesses';
import { adminRouter } from './routes/admin';
import { sbtRouter } from './routes/sbt';
import { errorHandler } from './middleware/error-handler';

/**
 * Build the Express app. Returned without listening so tests can drive it with
 * supertest. Domain routes are mounted here as later PRs add them.
 */
export function buildApp(): Express {
  const app = express();
  app.use(express.json());

  app.use(healthRouter);
  app.use(authRouter);
  app.use(businessRouter);
  app.use(adminRouter);
  app.use(sbtRouter);

  // Error handler is mounted last so it catches everything above it.
  app.use(errorHandler);
  return app;
}
