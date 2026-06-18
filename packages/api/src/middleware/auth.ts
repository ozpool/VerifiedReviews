import type { RequestHandler } from 'express';
import { verifyToken, type Role, type TokenClaims } from '../auth/jwt';
import { loadConfig } from '../config';
import { forbidden, unauthorized } from '../errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenClaims;
    }
  }
}

/** Require a valid Bearer JWT; attaches the decoded claims to `req.user`. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(unauthorized('Missing bearer token'));
    return;
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length), loadConfig().JWT_SECRET);
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
};

/** Require the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}
