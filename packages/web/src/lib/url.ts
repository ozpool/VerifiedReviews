/**
 * Return the URL only if it's a safe http(s) link, else undefined.
 *
 * Why: business-supplied URLs reach the UI via the API, and zod's `.url()` (the
 * URL constructor) accepts `javascript:`, `data:`, `vbscript:` etc. Rendering one
 * of those in an href is an XSS vector. Anything not http/https is rejected here
 * so callers can simply skip rendering the link.
 */
export function safeHttpUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
  } catch {
    /* not a parseable URL */
  }
  return undefined;
}
