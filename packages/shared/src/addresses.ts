import { z } from 'zod';
import { evmAddressSchema } from './schemas/common';

/** Arbitrum Sepolia — the only chain VerifiedReviews targets. */
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614 as const;

export const SUPPORTED_CHAIN_IDS = [ARBITRUM_SEPOLIA_CHAIN_ID] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function isSupportedChainId(id: number): id is SupportedChainId {
  return (SUPPORTED_CHAIN_IDS as readonly number[]).includes(id);
}

/** The deployed contract addresses each app needs to read/write the chain. */
export const contractAddressesSchema = z.object({
  sbt: evmAddressSchema,
  registry: evmAddressSchema,
});

export type ContractAddresses = z.infer<typeof contractAddressesSchema>;

/**
 * Validate a set of contract addresses (typically sourced from env). Addresses
 * are injected at runtime rather than hardcoded so the same build works across
 * redeploys; the concrete Arbitrum Sepolia values are wired in PR #5.
 */
export function resolveAddresses(input: unknown): ContractAddresses {
  return contractAddressesSchema.parse(input);
}
