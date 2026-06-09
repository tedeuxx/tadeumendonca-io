// BFF client (/frontend/api-client). Phase 1 routes are public — no JWT. Phase 2 adds the Cognito
// Bearer token + 401 handling. Throws the BFF's snake_case error body on non-2xx.
import { env } from '../env';

export interface ApiError {
  error: { code: string; message?: string };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: { code: 'request_failed' } }))) as ApiError;
    throw body;
  }
  return (await res.json()) as T;
}
