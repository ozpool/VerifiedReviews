import { Router } from 'express';
import { z } from 'zod';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '@vr/shared';
import { createNonce, extractNonce, verifySiwe } from '../auth/siwe';
import { signToken } from '../auth/jwt';
import { verifyPassword } from '../auth/password';
import { NonceModel } from '../models/nonce.model';
import { AdminModel } from '../models/admin.model';
import { BusinessModel } from '../models/business.model';
import { StaffModel } from '../models/staff.model';
import { validateBody } from './../middleware/validate';
import { loadConfig } from '../config';
import { unauthorized } from '../errors';
import { linkPrivyIdentity } from '../services/customer.service';

export const authRouter = Router();

/** Issue a single-use SIWE login nonce. */
authRouter.get('/auth/nonce', async (_req, res) => {
  const nonce = createNonce();
  await NonceModel.create({ value: nonce });
  res.json({ nonce });
});

const siweSchema = z.object({ message: z.string().min(1), signature: z.string().min(1) });

/** Verify a SIWE message + signature, consume the nonce, return a customer JWT. */
authRouter.post('/auth/siwe', validateBody(siweSchema), async (req, res, next) => {
  try {
    const { message, signature } = req.body as z.infer<typeof siweSchema>;
    const nonce = extractNonce(message);
    // Consume the nonce atomically; if it's gone, the login is stale or replayed.
    const consumed = await NonceModel.findOneAndDelete({ value: nonce });
    if (!consumed) throw unauthorized('Invalid or expired nonce');

    const config = loadConfig();
    const address = await verifySiwe(message, signature, {
      nonce,
      domain: config.APP_DOMAIN,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    });
    const token = signToken({ sub: address, role: 'customer' }, config.JWT_SECRET);
    res.json({ token, address });
  } catch (err) {
    next(err instanceof Error && err.name === 'AppError' ? err : unauthorized('SIWE login failed'));
  }
});

const privySchema = z.object({ token: z.string().min(1) });

/**
 * Embedded-wallet login. Verify a Privy session server-side, link the social
 * identity to the wallet Privy attests it controls, then issue the same customer
 * JWT the SIWE path does — so the rest of the API treats both logins identically.
 */
authRouter.post('/auth/privy', validateBody(privySchema), async (req, res, next) => {
  try {
    const { token } = req.body as z.infer<typeof privySchema>;
    const { address } = await linkPrivyIdentity(token);
    const jwtToken = signToken({ sub: address, role: 'customer' }, loadConfig().JWT_SECRET);
    res.json({ token: jwtToken, address });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

/** Admin email+password login. */
authRouter.post('/auth/admin/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const admin = await AdminModel.findOne({ email: email.toLowerCase() });
    if (!admin || !(await verifyPassword(password, admin.get('passwordHash')))) {
      throw unauthorized('Invalid credentials');
    }
    const token = signToken({ sub: admin.id, role: 'admin' }, loadConfig().JWT_SECRET);
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

/** Business-owner login. Only approved businesses can sign in. */
authRouter.post('/auth/business/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const business = await BusinessModel.findOne({ ownerEmail: email.toLowerCase() });
    if (
      !business ||
      business.status !== 'approved' ||
      business.businessId === undefined ||
      !(await verifyPassword(password, business.ownerPasswordHash))
    ) {
      throw unauthorized('Invalid credentials or business not approved');
    }
    const token = signToken(
      { sub: business.id, role: 'owner', businessId: business.businessId },
      loadConfig().JWT_SECRET,
    );
    res.json({ token, businessId: business.businessId });
  } catch (err) {
    next(err);
  }
});

/** Staff login. */
authRouter.post('/auth/staff/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const staff = await StaffModel.findOne({ email: email.toLowerCase(), active: true });
    if (!staff || !(await verifyPassword(password, staff.passwordHash))) {
      throw unauthorized('Invalid credentials');
    }
    const token = signToken(
      { sub: staff.id, role: 'staff', businessId: staff.businessId },
      loadConfig().JWT_SECRET,
    );
    res.json({ token, businessId: staff.businessId });
  } catch (err) {
    next(err);
  }
});
