import jwt, { type SignOptions } from 'jsonwebtoken';

export type Role = 'customer' | 'admin' | 'owner' | 'staff';

interface BaseClaims {
  sub: string;
  role: Role;
}
export interface CustomerClaims extends BaseClaims {
  role: 'customer';
}
export interface AdminClaims extends BaseClaims {
  role: 'admin';
}
/** Owner and staff tokens are scoped to a single business. */
export interface BusinessScopedClaims extends BaseClaims {
  role: 'owner' | 'staff';
  businessId: number;
}
export type TokenClaims = CustomerClaims | AdminClaims | BusinessScopedClaims;

const DEFAULT_TTL: SignOptions['expiresIn'] = '12h';

export function signToken(
  claims: TokenClaims,
  secret: string,
  expiresIn: SignOptions['expiresIn'] = DEFAULT_TTL,
): string {
  return jwt.sign(claims, secret, { expiresIn });
}

/** Verify and decode a token. Throws (TokenExpiredError / JsonWebTokenError) on failure. */
export function verifyToken(token: string, secret: string): TokenClaims {
  return jwt.verify(token, secret) as TokenClaims;
}
