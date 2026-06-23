import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

/**
 * Central error handler. Maps known error types to clean JSON responses and
 * never leaks internals on unexpected errors. Mounted last in the app.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'ValidationError', issues: err.issues });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }
  // Framework / body-parser errors carry their own 4xx status (e.g. a 413 for an
  // oversized body, or a 400 for malformed JSON). Honour it rather than masking
  // a client mistake as a 500.
  const status =
    (err as { status?: number; statusCode?: number }).status ??
    (err as { statusCode?: number }).statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: (err as Error).name || 'RequestError' });
    return;
  }
  // Unknown error: log server-side, return an opaque 500.
  console.error(err);
  res.status(500).json({ error: 'InternalServerError' });
};
