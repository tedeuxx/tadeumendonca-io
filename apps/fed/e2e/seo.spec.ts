import { test, expect } from '@playwright/test';

// SEO discovery regression (Issue #51, ADR-0005). The site ships complete on-page OG/meta; these journeys
// prove the *discovery* half — a served robots.txt with a sitemap pointer, and a sitemap.xml listing every
// canonical route. Assertions inspect the BODY, not just the status: CloudFront maps 403/404 → /index.html
// (200), and `vite preview` falls a missing path through to index.html too, so a missing file would
// masquerade as an HTML 200. Each check fails on that masquerade (same rigor as the empty-catalog guard in
// routes.spec.ts). The sitemap's canonical routes must match scripts/routes.mjs — the shared build source.
//
// Per-locale URLs (ADR-0036): the sitemap now lists each route under BOTH prefixes; the exact drift count +
// xhtml:link alternates are asserted in per-locale.spec.ts. Here we anchor on a representative per-locale
// set and the retired-path exclusions.
const CANONICAL = [
  'https://tadeumendonca.io/pt',
  'https://tadeumendonca.io/en',
  'https://tadeumendonca.io/pt/me',
  'https://tadeumendonca.io/en/me',
  'https://tadeumendonca.io/pt/blog/meu-compromisso',
  'https://tadeumendonca.io/en/blog/meu-compromisso',
];

test.describe('SEO discovery', () => {
  test('serves robots.txt allowing crawlers, with a sitemap pointer', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    // Not the SPA shell masquerading as the file.
    expect(body).not.toMatch(/<!doctype html>/i);
    expect(body).not.toContain('<html');
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Allow:\s*\//i);
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/im); // no blanket disallow
    expect(body).toContain('Sitemap: https://tadeumendonca.io/sitemap.xml');
  });

  test('serves a valid, non-empty sitemap.xml', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/<!doctype html>/i);
    expect(body).not.toContain('<html');
    expect(body.trimStart()).toMatch(/^<\?xml/);
    expect(body).toContain('<urlset');
    expect(body).toMatch(/<loc>.+<\/loc>/);
  });

  test('lists every canonical per-locale route and no redirects', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    for (const url of CANONICAL) {
      expect(body).toContain(`<loc>${url}</loc>`);
    }
    // The retired / redirect paths are never advertised (they aren't prerendered either). Note the
    // UNPREFIXED locale routes (bare /me, /portfolio) are redirects too — only the x-default root is bare.
    expect(body).not.toContain('/articles');
    expect(body).not.toContain('/profile');
    expect(body).not.toContain('<loc>https://tadeumendonca.io/cv</loc>'); // /cv was dropped pre-launch (#132)
    expect(body).not.toContain('<loc>https://tadeumendonca.io/me</loc>'); // bare /me redirects → never a <loc>
    expect(body).not.toContain('<loc>https://tadeumendonca.io/blog</loc>');
  });

  test('every advertised URL resolves to a live page', async ({ page, request }) => {
    // Take a representative loc from the sitemap and prove it is a real prerendered route, not a stale
    // entry — tying discovery back to ADR-0005's coverage guarantee.
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body).toContain('<loc>https://tadeumendonca.io/en/me</loc>');
    await page.goto('/en/me');
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
  });
});
