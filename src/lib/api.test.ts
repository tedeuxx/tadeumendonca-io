import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { fetchAuthSession, signInWithRedirect } = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
  signInWithRedirect: vi.fn(),
}));
vi.mock('aws-amplify/auth', () => ({ fetchAuthSession, signInWithRedirect }));

import { apiFetch, authedFetch } from './api';

describe('apiFetch (public)', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns the JSON body on 2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(apiFetch<{ ok: boolean }>('/profile')).resolves.toEqual({ ok: true });
  });

  it('throws the error body on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'not_found' } }), { status: 404 }));
    await expect(apiFetch('/profile')).rejects.toEqual({ error: { code: 'not_found' } });
  });
});

describe('authedFetch', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('attaches the access token as a Bearer header', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: { accessToken: { toString: () => 'tok-123' } } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await authedFetch('/posts', { method: 'POST' });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('returns undefined for a 204', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: { accessToken: { toString: () => 't' } } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(authedFetch('/subscriptions', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('re-authenticates when there is no token', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: undefined });
    await expect(authedFetch('/posts')).rejects.toMatchObject({ error: { code: 'unauthenticated' } });
    expect(signInWithRedirect).toHaveBeenCalled();
  });

  it('re-authenticates on a 401', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: { accessToken: { toString: () => 't' } } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(authedFetch('/posts')).rejects.toMatchObject({ error: { code: 'unauthorized' } });
    expect(signInWithRedirect).toHaveBeenCalled();
  });
});
