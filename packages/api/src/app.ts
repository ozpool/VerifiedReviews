import express, { type Express } from 'express';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';

/**
 * Build the Express app. Returned without listening so tests can drive it with
 * supertest. Domain routes are mounted here as later PRs add them.
 */
export function buildApp(): Express {
  const app = express();
  app.use(express.json());

  app.use(healthRouter);

  // Error handler is mounted last so it catches everything above it.
  app.use(errorHandler);
  return app;
}
