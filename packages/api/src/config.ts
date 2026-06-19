import { parseEnv } from '@vr/shared';
import { z } from 'zod';

/** Runtime configuration, validated at boot so a misconfigured deploy fails fast. */
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(source: Record<string, unknown> = process.env): AppConfig {
  return parseEnv(configSchema, source);
}
