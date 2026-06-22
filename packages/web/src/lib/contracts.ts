import type { Hex } from 'viem';

/**
 * Deployed contract addresses, injected at runtime from env (so the same build
 * works across redeploys). The review form needs the registry address to send
 * the on-chain submit; if it's unset the form degrades to a clear config notice
 * rather than throwing.
 */
const REGISTRY = process.env['NEXT_PUBLIC_REGISTRY_ADDRESS'] ?? '';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const isChainConfigured = ADDRESS_RE.test(REGISTRY);

export function registryAddress(): Hex {
  if (!ADDRESS_RE.test(REGISTRY)) {
    throw new Error('NEXT_PUBLIC_REGISTRY_ADDRESS is not configured');
  }
  return REGISTRY as Hex;
}
