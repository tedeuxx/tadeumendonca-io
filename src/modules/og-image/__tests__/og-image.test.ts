import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock at module boundaries: DynamoDB (getProfile), the S3 cache helpers, and the satori/resvg
// generator (its .wasm/.woff binary imports can't load under vitest — see vitest.config exclude).
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
const { objectExists, putImage } = vi.hoisted(() => ({ objectExists: vi.fn(), putImage: vi.fn() }));
const { generateOgImage, generatePostImage } = vi.hoisted(() => ({
  generateOgImage: vi.fn(async () => new Uint8Array([0x89, 0x50])),
  generatePostImage: vi.fn(async () => new Uint8Array([0x89, 0x50])),
}));

vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));
vi.mock('../../../shared/s3/client', () => ({ objectExists, putImage }));
vi.mock('../generator', () => ({ generateOgImage, generatePostImage }));

import { app } from '../../../index';

const profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Software Engineer',
  experience: [],
  education: [],
  certifications: [],
  skills: {},
  metadata: {},
};

afterEach(() => vi.clearAllMocks());

describe('GET /og/{type}/{slug}.png', () => {
  it('302s to the CDN on a cache hit, without generating', async () => {
    objectExists.mockResolvedValueOnce(true);
    const res = await app.request('/og/profile/me.png');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://staging.tadeumendonca.io/og/profile/me.png');
    expect(generateOgImage).not.toHaveBeenCalled();
    expect(putImage).not.toHaveBeenCalled();
  });

  it('generates, stores under {type}/{slug}.png, then 302s on a cache miss', async () => {
    objectExists.mockResolvedValueOnce(false);
    send.mockResolvedValueOnce({ Item: profile }); // getProfile
    const res = await app.request('/og/profile/me.png');
    expect(res.status).toBe(302);
    expect(generateOgImage).toHaveBeenCalledOnce();
    expect(putImage).toHaveBeenCalledWith('og/profile/me.png', expect.any(Uint8Array));
  });

  it('generates a post card on a cache miss for a published post', async () => {
    objectExists.mockResolvedValueOnce(false);
    send.mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'T', body: 'b', published: true, created_at: '2026-06-01T00:00:00Z' } });
    const res = await app.request('/og/posts/p1.png');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://staging.tadeumendonca.io/og/posts/p1.png');
    expect(generatePostImage).toHaveBeenCalledOnce();
    expect(putImage).toHaveBeenCalledWith('og/posts/p1.png', expect.any(Uint8Array));
  });

  it('404s a draft post (not published)', async () => {
    objectExists.mockResolvedValueOnce(false);
    send.mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'T', body: 'b', published: false, created_at: 'x' } });
    const res = await app.request('/og/posts/p1.png');
    expect(res.status).toBe(404);
    expect(putImage).not.toHaveBeenCalled();
  });

  it('404s for an unsupported type', async () => {
    objectExists.mockResolvedValueOnce(false);
    const res = await app.request('/og/articles/x.png');
    expect(res.status).toBe(404);
    expect(putImage).not.toHaveBeenCalled();
  });

  it('404s when the profile is absent on a cache miss', async () => {
    objectExists.mockResolvedValueOnce(false);
    send.mockResolvedValueOnce({}); // no Item
    const res = await app.request('/og/profile/me.png');
    expect(res.status).toBe(404);
    expect(putImage).not.toHaveBeenCalled();
  });
});
