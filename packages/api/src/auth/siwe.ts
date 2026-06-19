import { SiweMessage, generateNonce } from 'siwe';

/** Generate a fresh single-use login nonce. */
export function createNonce(): string {
  return generateNonce();
}

/** Pull the nonce out of a SIWE message so the server can look it up + consume it. */
export function extractNonce(message: string): string {
  return new SiweMessage(message).nonce;
}

export interface SiweExpectations {
  /** The server-issued single-use nonce that must appear in the message. */
  nonce: string;
  /** The domain the message must be bound to (blocks cross-site replay). */
  domain: string;
  /** The chain the message must target. */
  chainId: number;
}

/**
 * Verify a SIWE message + signature against the expected nonce, domain, and
 * chain. Returns the recovered (checksummed) wallet address on success; throws
 * otherwise. Binding domain + chainId prevents a signature obtained on another
 * site (or for another network) from being relayed to this API.
 */
export async function verifySiwe(
  message: string,
  signature: string,
  expected: SiweExpectations,
): Promise<string> {
  const siwe = new SiweMessage(message);
  if (siwe.chainId !== expected.chainId) {
    throw new Error('Unexpected chainId');
  }
  const result = await siwe.verify({
    signature,
    nonce: expected.nonce,
    domain: expected.domain,
  });
  if (!result.success) {
    throw new Error(result.error?.type ?? 'SIWE verification failed');
  }
  return result.data.address;
}
