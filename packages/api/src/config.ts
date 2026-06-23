import { parseEnv } from '@vr/shared';
import { z } from 'zod';

/** Normalize a private key from env: trim, treat blank as unset, and prepend the
 * `0x` viem requires when the user pasted a bare 64-hex key. */
function normalizePrivateKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return value as undefined;
  const v = value.trim();
  if (v === '') return undefined;
  return /^[0-9a-fA-F]{64}$/.test(v) ? `0x${v}` : v;
}

/** Runtime configuration, validated at boot so a misconfigured deploy fails fast. */
const configSchema = z
  .object({
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
    // SBT admin private key. Signs setBusinessMinter at approval to authorize a
    // business's derived minter on-chain. Optional so non-approving flows boot.
    ADMIN_PRIVATE_KEY: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'ADMIN_PRIVATE_KEY must be a 0x-prefixed 32-byte key')
      .optional(),
    // Per-business mint rate limit: at most MINT_RATE_MAX mints per business
    // within MINT_RATE_WINDOW_SEC. Defaults are sane; tests lower them.
    MINT_RATE_MAX: z.coerce.number().int().positive().default(30),
    MINT_RATE_WINDOW_SEC: z.coerce.number().int().positive().default(60),
    // Per-customer cap: at most this many VisitProofs to the same customer at the
    // same business within CUSTOMER_MINT_WINDOW_SEC (default 2 per 24h). Stops a
    // customer racking up reviews by being minted over and over — even if staff
    // scans them again, the extra mint is refused.
    CUSTOMER_MINT_DAILY_MAX: z.coerce.number().int().positive().default(2),
    CUSTOMER_MINT_WINDOW_SEC: z.coerce.number().int().positive().default(86_400),
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
    // How often the review indexer polls the chain for new ReviewSubmitted events.
    INDEXER_POLL_MS: z.coerce.number().int().positive().default(15000),
    // Privy app id + secret for verifying embedded-wallet logins. Optional so
    // non-Privy flows boot; the verifier throws clearly if a Privy login is
    // attempted without them. The secret is never logged or sent to the browser.
    PRIVY_APP_ID: z.string().optional(),
    PRIVY_APP_SECRET: z.string().optional(),
    // Allowed browser origin(s) for CORS — comma-separated. Defaults to the local
    // web app; set explicitly to your deployed web URL in production.
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    // General per-IP API rate limit (the mint path has its own tighter limit).
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().positive().default(60),
    // Gas-tank wallet: a server-funded account holding free Arbitrum Sepolia
    // testnet ETH. At mint time the API sends a tiny top-up to the customer so
    // their embedded wallet can pay its own (free, testnet) gas when reviewing —
    // the customer never has to fund anything. Optional: when unset the top-up is
    // a no-op and customers must already hold gas. NEVER a real-money key on
    // mainnet; testnet only for now.
    // Accept a bare 64-hex key or a 0x-prefixed one; blank means "disabled".
    // Normalized to 0x form so viem's privateKeyToAccount accepts it.
    GAS_TANK_PRIVATE_KEY: z.preprocess(
      normalizePrivateKey,
      z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'GAS_TANK_PRIVATE_KEY must be a 32-byte hex key')
        .optional(),
    ),
    // How much testnet ETH to send per top-up (a couple of submits' worth).
    GAS_TANK_TOPUP_ETH: z.string().default('0.0005'),
    // Skip the top-up when the customer already holds at least this much, so we
    // don't drain the tank on repeat visitors who still have gas.
    GAS_TANK_MIN_BALANCE_ETH: z.string().default('0.0003'),
    // Minter gas funding (paid from the admin/treasury wallet, ADMIN_PRIVATE_KEY).
    // A business's minter needs ETH to pay gas when it mints receipts. We fund it
    // automatically at approval (B) and refill it on a schedule (C) so staff never
    // hit an out-of-gas mint. Amount sent each top-up:
    MINTER_FUND_AMOUNT_ETH: z.string().default('0.02'),
    // Top up a minter only when it dips below this — covers thousands of mints, so
    // refills are rare.
    MINTER_MIN_BALANCE_ETH: z.string().default('0.005'),
    // How often the background refiller sweeps every approved business's minter.
    // Default 1h; minters drain slowly so this need not be frequent.
    MINTER_REFILL_POLL_MS: z.coerce.number().int().positive().default(3_600_000),
  })
  // Fail a production boot fast if integrity-critical secrets are missing, so a
  // misconfigured deploy never serves unsigned badges or a weak CORS posture.
  .refine((c) => c.NODE_ENV !== 'production' || !!c.BADGE_HMAC_KEY, {
    message: 'BADGE_HMAC_KEY is required in production',
    path: ['BADGE_HMAC_KEY'],
  })
  .refine((c) => c.NODE_ENV !== 'production' || c.CORS_ORIGIN !== 'http://localhost:3000', {
    message: 'CORS_ORIGIN must be set to your deployed web origin in production',
    path: ['CORS_ORIGIN'],
  });

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(source: Record<string, unknown> = process.env): AppConfig {
  return parseEnv(configSchema, source);
}
