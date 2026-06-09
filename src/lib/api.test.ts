import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './api';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns the JSON body on 2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await expect(apiFetch<{ ok: boolean }>('/profile')).resolves.toEqual({ ok: true });
  });

  it('throws the error body on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'not_found' } }), { status: 404 }),
    );
    await expect(apiFetch('/profile')).rejects.toEqual({ error: { code: 'not_found' } });
  });
});
