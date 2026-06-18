import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

// useMe gates its query on the auth status — drive it from the test (default: signed in).
let authStatus = 'authenticated';
vi.mock('../auth/authStore', () => ({ useAuth: (sel: (s: { status: string }) => unknown) => sel({ status: authStatus }) }));

import { useMe, useUpdateMe } from './useMe';

let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

beforeEach(() => {
  authStatus = 'authenticated';
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(() => vi.clearAllMocks());

describe('useMe', () => {
  it('reads the profile from GET /me', async () => {
    authedFetch.mockResolvedValueOnce({ cognito_sub: 'u-1', newsletter_opt_in: true, newsletter_schedule: 'weekly', created_at: 'x' });
    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.data?.cognito_sub).toBe('u-1'));
    expect(authedFetch).toHaveBeenCalledWith('/me');
  });

  it('does NOT fetch while anonymous (public site must not bounce visitors to login)', async () => {
    authStatus = 'anonymous';
    const { result } = renderHook(() => useMe(), { wrapper });
    await Promise.resolve();
    expect(authedFetch).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateMe', () => {
  it('PUTs the prefs and caches the server echo', async () => {
    const echo = { cognito_sub: 'u-1', newsletter_opt_in: true, newsletter_schedule: 'daily', created_at: 'x' };
    authedFetch.mockResolvedValueOnce(echo);
    const { result } = renderHook(() => useUpdateMe(), { wrapper });
    act(() => result.current.mutate({ newsletter_opt_in: true, newsletter_schedule: 'daily' }));
    await waitFor(() => expect(authedFetch).toHaveBeenCalledWith('/me', expect.objectContaining({ method: 'PUT' })));
    await waitFor(() => expect(qc.getQueryData(['me'])).toEqual(echo)); // server echo cached
  });
});
