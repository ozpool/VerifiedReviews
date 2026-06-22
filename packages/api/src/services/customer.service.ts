import { CustomerModel } from '../models/customer.model';
import { getPrivyVerifier, type PrivyVerifier } from '../auth/privy';
import { unauthorized } from '../errors';

export interface LinkedCustomer {
  address: string;
}

/**
 * Verify a Privy access token and upsert the social-identity→address link. The
 * address comes from Privy's attestation, never from the client. Upsert by
 * privyUserId so a returning user — or a re-link after the user changes wallets —
 * is harmless. Returns the verified address so the caller can issue a session.
 */
export async function linkPrivyIdentity(
  accessToken: string,
  verifier: PrivyVerifier = getPrivyVerifier(),
): Promise<LinkedCustomer> {
  let verified;
  try {
    verified = await verifier.verify(accessToken);
  } catch {
    throw unauthorized('Invalid Privy token');
  }

  // Normalize here so the session + stored link are consistent regardless of the
  // verifier impl's casing (addresses are case-insensitive; we key on lowercase).
  const address = verified.address.toLowerCase();
  await CustomerModel.findOneAndUpdate(
    { privyUserId: verified.userId },
    { $set: { address } },
    { upsert: true, new: true },
  );
  return { address };
}
