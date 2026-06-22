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
    ? process.env['NEXT_PUBLIC_API_URL'] // SSR / build time
    : window.__NEXT_DATA__?.props?.apiUrl) ?? // never used — just TS-safe
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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

// ---- Typed endpoints ----

export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

/** A public business profile (only non-private fields the API exposes). */
export interface PublicBusiness {
  slug: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  websiteUrl?: string;
  businessId: number;
}

/** A confirmed (on-chain-verified) review as the search endpoint returns it. */
export interface Review {
  businessId: number;
  reviewer: string;
  rating: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  txHash: string;
  createdAt: string;
}

/** HMAC-signed aggregate counts the badge endpoint serves. */
export interface Badge {
  businessId: number;
  count: number;
  avgRating: number;
  signature: string;
}

export interface BrowseFilters {
  q?: string;
  city?: string;
  category?: string;
}

/** GET /businesses — approved businesses, optionally filtered. */
export function fetchBusinesses(filters: BrowseFilters = {}): Promise<PublicBusiness[]> {
  const qs = new URLSearchParams();
  if (filters.q) qs.set('q', filters.q);
  if (filters.city) qs.set('city', filters.city);
  if (filters.category) qs.set('category', filters.category);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<PublicBusiness[]>(`/businesses${suffix}`);
}

/** GET /businesses/:slug — one approved business. */
export function fetchBusiness(slug: string): Promise<PublicBusiness> {
  return apiFetch<PublicBusiness>(`/businesses/${encodeURIComponent(slug)}`);
}

/** GET /reviews/search — a business's confirmed reviews, optional full-text q. */
export function fetchReviews(businessId: number, q?: string): Promise<Review[]> {
  const qs = new URLSearchParams({ businessId: String(businessId) });
  if (q) qs.set('q', q);
  return apiFetch<Review[]>(`/reviews/search?${qs}`);
}

/** GET /badge/:bizId — signed verified count + average rating. */
export function fetchBadge(businessId: number): Promise<Badge> {
  return apiFetch<Badge>(`/badge/${businessId}`);
}

/** The review text + on-chain commitment the API ingests after a submit tx. */
export interface ReviewIngestPayload {
  businessId: number;
  reviewer: string;
  rating: number;
  text: string;
  nonce: string;
  contentHash: string;
  txHash: string;
}

/** POST /reviews — store the text once its tx is on-chain. The API rejects it
 * unless the text hashes to the committed contentHash. */
export function ingestReview(
  payload: ReviewIngestPayload,
): Promise<{ contentHash: string; confirmed: boolean }> {
  return apiFetch('/reviews', { method: 'POST', body: payload });
}

// ---- Staff endpoints (JWT-authenticated) ----

export interface StaffSession {
  token: string;
  businessId: number;
  slug: string;
}

/** POST /auth/staff/login — exchange credentials for a business-scoped JWT. */
export function loginStaff(email: string, password: string): Promise<StaffSession> {
  return apiFetch<StaffSession>('/auth/staff/login', {
    method: 'POST',
    body: { email, password },
  });
}

export interface MintResult {
  tokenId: string;
  txHash: string;
}

/** POST /sbt/mint — mint a VisitProof to a customer wallet (staff/owner only). */
export function mintVisitProof(
  token: string,
  businessId: number,
  customerAddr: string,
): Promise<MintResult> {
  return apiFetch<MintResult>('/sbt/mint', {
    method: 'POST',
    token,
    body: { businessId, customerAddr },
  });
}

export interface MintRow {
  customerAddr: string;
  tokenId: string;
  txHash: string;
  createdAt: string;
}

/** GET /sbt/mints — the staff's own business mint log (default last 24h). */
export function fetchMints(token: string): Promise<MintRow[]> {
  return apiFetch<MintRow[]>('/sbt/mints', { token });
}

// ---- Owner + admin endpoints (JWT-authenticated) ----

export interface OwnerSession {
  token: string;
  businessId: number;
}

/** POST /auth/business/login — owner login (only approved businesses). */
export function loginOwner(email: string, password: string): Promise<OwnerSession> {
  return apiFetch<OwnerSession>('/auth/business/login', {
    method: 'POST',
    body: { email, password },
  });
}

export interface RegisterBusinessPayload {
  name: string;
  slug: string;
  category: string;
  city: string;
  description?: string;
  websiteUrl?: string;
  ownerEmail: string;
  ownerPassword: string;
}

/** POST /businesses — submit a new business application (lands in pending). */
export function registerBusiness(
  payload: RegisterBusinessPayload,
): Promise<{ id: string; slug: string; status: string }> {
  return apiFetch('/businesses', { method: 'POST', body: payload });
}

export interface AdminSession {
  token: string;
}

/** POST /auth/admin/login. */
export function loginAdmin(email: string, password: string): Promise<AdminSession> {
  return apiFetch<AdminSession>('/auth/admin/login', { method: 'POST', body: { email, password } });
}

export interface StaffMember {
  _id: string;
  email: string;
}

/** GET /businesses/:id/staff — owner's active staff. */
export function fetchStaff(token: string, businessId: number): Promise<StaffMember[]> {
  return apiFetch<StaffMember[]>(`/businesses/${businessId}/staff`, { token });
}

/** POST /businesses/:id/staff — add a staff member. */
export function addStaff(token: string, businessId: number, email: string, password: string) {
  return apiFetch<{ id: string; email: string }>(`/businesses/${businessId}/staff`, {
    method: 'POST',
    token,
    body: { email, password },
  });
}

/** DELETE /businesses/:id/staff/:staffId — deactivate a staff member. */
export function removeStaff(token: string, businessId: number, staffId: string): Promise<void> {
  return apiFetch(`/businesses/${businessId}/staff/${staffId}`, { method: 'DELETE', token });
}

export interface AdminBusiness {
  _id: string;
  slug: string;
  name: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
  businessId?: number;
}

/** GET /admin/businesses?status= — admin business list. */
export function adminListBusinesses(token: string, status?: string): Promise<AdminBusiness[]> {
  return apiFetch<AdminBusiness[]>(`/admin/businesses${status ? `?status=${status}` : ''}`, {
    token,
  });
}

/** POST /admin/businesses/:id/approve. */
export function adminApprove(token: string, id: string) {
  return apiFetch<{ status: string; businessId: number }>(`/admin/businesses/${id}/approve`, {
    method: 'POST',
    token,
  });
}
