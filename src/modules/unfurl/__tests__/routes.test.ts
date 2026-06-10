import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup }));
const { objectExists, putImage } = vi.hoisted(() => ({ objectExists: vi.fn(), putImage: vi.fn() }));
vi.mock('../../../shared/s3/client', () => ({ objectExists, putImage }));

import { app } from '../../../index';

const headers = { 'content-type': 'application/json' };
const admin = { event: { requestContext: { authorizer: { claims: { sub: 'a-1', 'cognito:groups': '[admin]' } } } } };
const registered = { event: { requestContext: { authorizer: { claims: { sub: 'u-1', 'cognito:groups': '[registered]' } } } } };

beforeEach(() => {
  lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  objectExists.mockResolvedValue(true); // skip putImage
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('POST /admin/unfurl', () => {
  it('403s without authentication', async () => {
    const res = await app.request('/admin/unfurl', { method: 'POST', headers, body: JSON.stringify({ url: 'https://x.com/a' }) });
    expect(res.status).toBe(403);
  });

  it('403s for a non-admin', async () => {
    const res = await app.request('/admin/unfurl', { method: 'POST', headers, body: JSON.stringify({ url: 'https://x.com/a' }) }, registered);
    expect(res.status).toBe(403);
  });

  it('400s an invalid url at the schema', async () => {
    const res = await app.request('/admin/unfurl', { method: 'POST', headers, body: JSON.stringify({ url: 'not-a-url' }) }, admin);
    expect(res.status).toBe(400);
  });

  it('returns a degraded card for X (admin)', async () => {
    const res = await app.request('/admin/unfurl', { method: 'POST', headers, body: JSON.stringify({ url: 'https://x.com/jack/status/1' }) }, admin);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { provider: string };
    expect(body.provider).toBe('X');
  });
});
