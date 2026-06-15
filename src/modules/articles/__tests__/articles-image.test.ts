import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Jimp } from 'jimp';

// Mock the asset store so the route doesn't hit S3; the jimp pipeline runs for real (small images).
const { putAsset } = vi.hoisted(() => ({ putAsset: vi.fn() }));
vi.mock('../../../shared/s3/client', () => ({ putAsset, deleteAsset: vi.fn(), putImage: vi.fn(), objectExists: vi.fn(), s3: {} }));

import { app } from '../../../index';
import { processArticleImage, ARTICLE_IMAGE_MAX_DIM } from '../image';

const claims = (groups?: string) => ({
  event: { requestContext: { authorizer: { claims: { sub: 'u-1', ...(groups ? { 'cognito:groups': groups } : {}) } } } },
});
const headers = { 'content-type': 'application/json' };
const pngBase64 = async (width: number, height: number, color = 0xff0000ff) =>
  (await new Jimp({ width, height, color }).getBuffer('image/png')).toString('base64');

beforeEach(() => putAsset.mockResolvedValue(undefined));
afterEach(() => vi.clearAllMocks());

describe('POST /articles/image (admin)', () => {
  const post = (body: unknown, ctx?: object) => app.request('/articles/image', { method: 'POST', headers, body: JSON.stringify(body) }, ctx);

  it('403s without auth', async () => {
    expect((await post({ image_base64: 'aGk=' })).status).toBe(403);
    expect(putAsset).not.toHaveBeenCalled();
  });

  it('403s a non-admin', async () => {
    expect((await post({ image_base64: 'aGk=' }, claims('registered'))).status).toBe(403);
  });

  it('400s an empty body', async () => {
    expect((await post({ image_base64: '' }, claims('admin'))).status).toBe(400);
  });

  it('stores a resized PNG and returns the public CDN URL + dimensions', async () => {
    const res = await post({ image_base64: await pngBase64(120, 80) }, claims('admin'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; width: number; height: number };
    expect(body).toMatchObject({ width: 120, height: 80 });
    expect(body.url).toMatch(/\/assets\/articles\/[0-9a-f]{16}\.png$/);
    // the stored object lands in the assets bucket under the content-addressed key, as PNG
    expect(putAsset).toHaveBeenLastCalledWith(expect.stringMatching(/^articles\/[0-9a-f]{16}\.png$/), expect.anything(), 'image/png');
    const key = putAsset.mock.calls.at(-1)?.[0] as string;
    expect(body.url.endsWith(`/assets/${key}`)).toBe(true);
  });
});

describe('processArticleImage', () => {
  it('downscales the long edge past the cap while preserving aspect (no crop)', async () => {
    const out = await processArticleImage(await pngBase64(ARTICLE_IMAGE_MAX_DIM * 2, ARTICLE_IMAGE_MAX_DIM));
    expect(out.width).toBe(ARTICLE_IMAGE_MAX_DIM);
    expect(out.height).toBe(ARTICLE_IMAGE_MAX_DIM / 2); // 2:1 aspect kept
  });

  it('leaves a small image untouched (never upscales)', async () => {
    const out = await processArticleImage(await pngBase64(100, 60));
    expect(out.width).toBe(100);
    expect(out.height).toBe(60);
  });

  it('rejects a corrupt image (400)', async () => {
    await expect(processArticleImage(Buffer.from('not an image').toString('base64'))).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an oversized decoded payload (413)', async () => {
    const big = Buffer.alloc(11 * 1024 * 1024, 1).toString('base64');
    await expect(processArticleImage(big)).rejects.toMatchObject({ status: 413 });
  });
});
