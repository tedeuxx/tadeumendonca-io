// BFF client (/frontend/api-client). Public calls use apiFetch; authenticated calls use authedFetch,
// which attaches the Cognito access token as a Bearer and re-authenticates on 401. The BFF returns a
// snake_case error body on non-2xx, which we throw verbatim.
import { fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth';
import { env } from '../env';

export interface ApiError {
  error: { code: string; message?: string };
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: { code: 'request_failed' } }))) as ApiError;
    throw body;
  }
  return (await res.json()) as T;
}

// Public (no auth) — Phase 1 routes + the public feed reads.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return parse<T>(await fetch(`${env.apiBaseUrl}${path}`, init));
}

// Authenticated — attaches the access token; a 401 means the session lapsed → re-login.
export async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await fetchAuthSession()).tokens?.accessToken?.toString();
  if (!token) {
    await signInWithRedirect();
    throw { error: { code: 'unauthenticated' } } satisfies ApiError;
  }
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    await signInWithRedirect();
    throw { error: { code: 'unauthorized' } } satisfies ApiError;
  }
  return parse<T>(res);
}
