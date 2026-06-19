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
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(source: Record<string, unknown> = process.env): AppConfig {
  return parseEnv(configSchema, source);
}
