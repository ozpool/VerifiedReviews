import { z } from 'zod';

/**
 * Parse and validate an environment object against a zod schema. Throws a single
 * readable error listing every missing/invalid var, so a misconfigured service
 * fails loudly at boot instead of producing confusing runtime errors later.
 *
 * Each app composes its own schema and passes its own source (e.g. process.env).
 * Kept source-agnostic so this module stays free of Node globals and is safe to
 * import anywhere.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, unknown>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
