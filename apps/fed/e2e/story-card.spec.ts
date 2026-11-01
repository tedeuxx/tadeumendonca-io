import { test, expect } from '@playwright/test';
import { HELD_KEY } from '../src/content/heldFixture';

// #662 — the vertical Instagram Story card, against the SERVED artifact.
//
// The unit suite (scripts/story-cards.test.mjs) proves the committed PNGs are the right set, decode to
// the derived URL and honour the QR's physical floor. This proves the build ships them where slice B
// (#789) will fetch them, `/story/<key>.<locale>.png`, as images: a card committed under `public/` and
// lost by the build would leave every unit test green.
//
// The assertion is on the CONTENT TYPE, not on a 404, for the reason held-draft.spec.ts gives: neither
// `vite preview` nor CloudFront returns a 404 for a missing file — both answer with the SPA shell.
test.describe('the Story card is served for a published article, and not for a held one', () => {
  test('serves both locale cards of a published article as PNG', async ({ request }) => {
    for (const locale of ['pt', 'en'] as const) {
      const res = await request.get(`/story/my-commitment.${locale}.png`);
      expect(res.status(), locale).toBe(200);
      expect(res.headers()['content-type'], locale).toContain('image/png');
      // 1080×1920, read from the PNG header (IHDR width and height, big-endian at bytes 16 and 20).
      const body = await res.body();
      expect([body.readUInt32BE(16), body.readUInt32BE(20)], locale).toEqual([1080, 1920]);
    }
  });

  test('serves no Story card for the held article, in either locale', async ({ request }) => {
    for (const locale of ['pt', 'en'] as const) {
      const res = await request.get(`/story/${HELD_KEY}.${locale}.png`);
      expect(res.headers()['content-type'], `${locale}: a held article must have no Story card`).not.toContain('image');
    }
  });
});
