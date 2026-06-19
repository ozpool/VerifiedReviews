/**
 * Typed fetch wrapper for the VerifiedReviews Express API.
 *
 * All requests go through `apiFetch` so we have one place to inject the base
 * URL, auth headers, and normalise error shapes. TanStack Query calls this
 * from `queryFn` — it never hits the network on the server unless you
 * explicitly call it from a Server Component or Route Handler.
 */

const API_BASE =
  (typeof window === 'undefined'
    ? process.env['NEXT_PUBLIC_API_URL']   // SSR / build time
    : window.__NEXT_DATA__?.props?.apiUrl  // never used — just TS-safe
  ) ??
  process.env['NEXT_PUBLIC_API_URL'] ??
  'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text();
    }
    throw new ApiError(res.status, errBody, `API ${res.status}: ${path}`);
  }

  // 204 No Content — return empty object cast to T
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ---- Typed endpoints (grow this as pages are added in PR #11–#13) ----

export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}
