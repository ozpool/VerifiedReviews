import { SiweMessage, generateNonce } from 'siwe';

/** Generate a fresh single-use login nonce. */
export function createNonce(): string {
  return generateNonce();
}

/** Pull the nonce out of a SIWE message so the server can look it up + consume it. */
export function extractNonce(message: string): string {
  return new SiweMessage(message).nonce;
}

/**
 * Verify a SIWE message + signature against an expected nonce. Returns the
 * recovered (checksummed) wallet address on success; throws otherwise.
 */
export async function verifySiwe(
  message: string,
  signature: string,
  expectedNonce: string,
): Promise<string> {
  const siwe = new SiweMessage(message);
  const result = await siwe.verify({ signature, nonce: expectedNonce });
  if (!result.success) {
    throw new Error(result.error?.type ?? 'SIWE verification failed');
  }
  return result.data.address;
}
