import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Validate `req.body` against a zod schema. On success, replaces the body with
 * the parsed (and coerced) value; on failure, forwards the ZodError to the
 * error handler, which turns it into a 400.
 */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Same as {@link validateBody} but for the parsed query string. */
export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    next();
  };
}
