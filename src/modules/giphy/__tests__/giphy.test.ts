import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub the Giphy key fetch + the SSRF-guarded HTTP so the proxy is hermetic.
const { getSecret } = vi.hoisted(() => ({ getSecret: vi.fn() }));
vi.mock('../../../shared/secrets', () => ({ getSecret }));
const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../unfurl/ssrf', () => ({ safeFetch }));

import { app } from '../../../index';

const claims = (groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub: 'u-1', ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});

const giphyBody = (data: unknown) => ({
  status: 200,
  contentType: 'application/json',
  bytes: new TextEncoder().encode(JSON.stringify({ data })),
});

beforeEach(() => getSecret.mockResolvedValue({ api_key: 'k' }));
afterEach(() => vi.clearAllMocks());

describe('GET /giphy/search (admin)', () => {
  it('403s without auth', async () => {
    expect((await app.request('/giphy/search?q=cat')).status).toBe(403);
  });

  it('403s a non-admin', async () => {
    expect((await app.request('/giphy/search?q=cat', {}, claims('registered'))).status).toBe(403);
  });

  it('400s a missing query', async () => {
    expect((await app.request('/giphy/search', {}, claims('admin'))).status).toBe(400);
  });

  it('maps results to the trimmed shape, drops unusable ones, and returns attribution', async () => {
    safeFetch.mockResolvedValueOnce(
      giphyBody([
        {
          id: 'g1',
          title: 'cat',
          images: {
            downsized: { url: 'https://media.giphy.com/g1.gif', width: '200', height: '150' },
            fixed_width_small: { url: 'https://media.giphy.com/g1s.gif', width: '100', height: '75' },
          },
        },
        { id: 'g2', title: 'no usable image' }, // dropped — no images
        { title: 'no id', images: { downsized: { url: 'x', width: '1', height: '1' } } }, // dropped — no id
      ]),
    );
    const res = await app.request('/giphy/search?q=cat&limit=10&offset=5', {}, claims('admin'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>>; attribution: string };
    expect(body.attribution).toBe('Powered By GIPHY');
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ id: 'g1', url: 'https://media.giphy.com/g1.gif', width: 200, height: 150, preview_url: 'https://media.giphy.com/g1s.gif' });
    // the key + query + paging are forwarded to Giphy
    const calledUrl = safeFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('api_key=k');
    expect(calledUrl).toContain('q=cat');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('offset=5');
  });

  it('falls back to original/fixed_width renditions when downsized is absent', async () => {
    safeFetch.mockResolvedValueOnce(giphyBody([{ id: 'g3', images: { original: { url: 'https://media.giphy.com/g3.gif', width: '480', height: '270' } } }]));
    const res = await app.request('/giphy/search?q=dog', {}, claims('admin'));
    const body = (await res.json()) as { items: Array<Record<string, unknown>> };
    expect(body.items[0]).toMatchObject({ id: 'g3', url: 'https://media.giphy.com/g3.gif', preview_url: 'https://media.giphy.com/g3.gif' });
  });

  it('502s when Giphy returns a non-2xx response', async () => {
    safeFetch.mockResolvedValueOnce({ status: 429, contentType: 'application/json', bytes: new TextEncoder().encode('{}') });
    expect((await app.request('/giphy/search?q=cat', {}, claims('admin'))).status).toBe(502);
  });
});
