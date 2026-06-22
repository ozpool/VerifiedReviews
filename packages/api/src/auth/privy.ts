import { PrivyClient } from '@privy-io/server-auth';
import { loadConfig } from '../config';

export interface VerifiedPrivyUser {
  /** Privy DID — stable per social identity (e.g. "did:privy:..."). */
  userId: string;
  /** The wallet address Privy attests the user controls (lowercased). */
  address: string;
}

/**
 * The Privy verification surface the auth route depends on. Kept tiny and
 * injectable so tests can supply a fake without a live Privy app — the same
 * pattern the mint orchestrator and minter registrar use.
 */
export interface PrivyVerifier {
  verify(accessToken: string): Promise<VerifiedPrivyUser>;
}

/**
 * Real verifier. Cryptographically verifies the access token, then fetches the
 * authoritative user from Privy to read their wallet address. We never trust an
 * address the client claims — only what Privy attests. Prefers the embedded
 * ("privy") wallet, falling back to any linked wallet.
 */
export function createPrivyVerifier(): PrivyVerifier {
  const { PRIVY_APP_ID, PRIVY_APP_SECRET } = loadConfig();
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET are required for Privy login');
  }
  const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

  return {
    async verify(accessToken) {
      const { userId } = await client.verifyAuthToken(accessToken);
      const user = await client.getUser(userId);
      // Narrow defensively so we don't couple to the SDK's exact union types.
      const accounts = user.linkedAccounts as Array<{
        type: string;
        address?: string;
        walletClientType?: string;
      }>;
      const embedded = accounts.find(
        (a) => a.type === 'wallet' && a.walletClientType === 'privy' && a.address,
      );
      const anyWallet = accounts.find((a) => a.type === 'wallet' && a.address);
      const address = (embedded ?? anyWallet)?.address;
      if (!address) throw new Error('Privy user has no linked wallet');
      return { userId, address: address.toLowerCase() };
    },
  };
}

let instance: PrivyVerifier | null = null;

/** Memoized real verifier, built lazily so config is only required at login time. */
export function getPrivyVerifier(): PrivyVerifier {
  if (!instance) instance = createPrivyVerifier();
  return instance;
}

/** Swap the verifier (tests inject a fake; pass null to reset). */
export function setPrivyVerifier(verifier: PrivyVerifier | null): void {
  instance = verifier;
}
