import { describe, it, expect } from 'vitest';
import { Jimp } from 'jimp';
import { processAvatar, AVATAR_SIZE } from '../avatar';

// A real (small) PNG, so jimp actually runs — this is the verification that the pure-JS pipeline works.
async function pngBase64(width: number, height: number, color = 0xff8800ff): Promise<string> {
  const buf = await new Jimp({ width, height, color }).getBuffer('image/png');
  return buf.toString('base64');
}

describe('processAvatar', () => {
  it('resizes any source to a square PNG and keys it by content hash', async () => {
    const out = await processAvatar('u-1', await pngBase64(120, 80));
    expect(out.contentType).toBe('image/png');
    const img = await Jimp.read(Buffer.from(out.body));
    expect(img.width).toBe(AVATAR_SIZE);
    expect(img.height).toBe(AVATAR_SIZE);
    expect(out.key).toMatch(/^avatars\/u-1-[0-9a-f]{16}\.png$/);
  });

  it('is idempotent — the same image yields the same key', async () => {
    const src = await pngBase64(64, 64, 0x112233ff);
    const a = await processAvatar('u-1', src);
    const b = await processAvatar('u-1', src);
    expect(a.key).toBe(b.key);
  });

  it('produces a different key for a different image (cache-bust on change)', async () => {
    const a = await processAvatar('u-1', await pngBase64(64, 64, 0x112233ff));
    const b = await processAvatar('u-1', await pngBase64(64, 64, 0x445566ff));
    expect(a.key).not.toBe(b.key);
  });

  it('rejects empty input with 400', async () => {
    await expect(processAvatar('u-1', '')).rejects.toMatchObject({ status: 400 });
  });

  it('rejects undecodable input with 400', async () => {
    const notAnImage = Buffer.from('hello world, not an image').toString('base64');
    await expect(processAvatar('u-1', notAnImage)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects oversized input with 413', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1).toString('base64');
    await expect(processAvatar('u-1', big)).rejects.toMatchObject({ status: 413 });
  });
});
