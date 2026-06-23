import type { Hex } from 'viem';

/**
 * Deployed contract addresses, injected at runtime from env (so the same build
 * works across redeploys). The review form needs the registry address to send
 * the on-chain submit; if it's unset the form degrades to a clear config notice
 * rather than throwing.
 */
const REGISTRY = process.env['NEXT_PUBLIC_REGISTRY_ADDRESS'] ?? '';
const SBT = process.env['NEXT_PUBLIC_SBT_ADDRESS'] ?? '';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const isChainConfigured = ADDRESS_RE.test(REGISTRY);
/** The SBT address is needed to *read* a customer's visit eligibility on the
 * client. Separate flag so the review form can still submit even if only the
 * registry is set (eligibility reads just degrade to "unknown"). */
export const isSbtConfigured = ADDRESS_RE.test(SBT);

export function registryAddress(): Hex {
  if (!ADDRESS_RE.test(REGISTRY)) {
    throw new Error('NEXT_PUBLIC_REGISTRY_ADDRESS is not configured');
  }
  return REGISTRY as Hex;
}

export function sbtAddress(): Hex {
  if (!ADDRESS_RE.test(SBT)) {
    throw new Error('NEXT_PUBLIC_SBT_ADDRESS is not configured');
  }
  return SBT as Hex;
}
