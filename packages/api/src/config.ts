import { parseEnv } from '@vr/shared';
import { z } from 'zod';

/** Runtime configuration, validated at boot so a misconfigured deploy fails fast. */
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // The domain SIWE messages must be bound to (prevents cross-site replay).
  APP_DOMAIN: z.string().min(1).default('localhost'),
  // Master mnemonic for deriving per-business minter wallets. Required to
  // approve businesses and to mint (PR #8); optional so other flows can boot.
  MINTER_MNEMONIC: z.string().optional(),
  // JSON-RPC endpoint for chain writes (Arbitrum Sepolia). Required to mint;
  // optional so non-minting flows (auth, onboarding) can boot without it.
  RPC_URL: z.string().url().optional(),
  // Deployed VisitProofSBT address the minter writes to. Optional for the same
  // reason; the mint path throws clearly if it (or RPC_URL) is missing.
  SBT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'SBT_ADDRESS must be a 0x-prefixed address')
    .optional(),
  // Per-business mint rate limit: at most MINT_RATE_MAX mints per business
  // within MINT_RATE_WINDOW_SEC. Defaults are sane; tests lower them.
  MINT_RATE_MAX: z.coerce.number().int().positive().default(30),
  MINT_RATE_WINDOW_SEC: z.coerce.number().int().positive().default(60),
  // Deployed ReviewRegistry address the indexer reads ReviewSubmitted from.
  REGISTRY_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'REGISTRY_ADDRESS must be a 0x-prefixed address')
    .optional(),
  // Dedicated indexer RPC (e.g. Alchemy) — public RPCs throttle eth_getLogs.
  // Falls back to RPC_URL when unset.
  INDEXER_RPC_URL: z.string().url().optional(),
  // Secret for HMAC-signing badge counts so an embed can't be doctored.
  BADGE_HMAC_KEY: z.string().min(16, 'BADGE_HMAC_KEY must be at least 16 characters').optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(source: Record<string, unknown> = process.env): AppConfig {
  return parseEnv(configSchema, source);
}
