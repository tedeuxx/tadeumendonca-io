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
  'https://tadeumendonca.io/en/blog/my-commitment', // per-locale slug (ADR-0037): EN carries its own slug
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

  test('a representative advertised URL resolves to its own prerendered page', async ({ page, request }) => {
    // Renamed from "every advertised URL…" (#200): it checks ONE, and the title claimed all of them.
    // The all-of-them property is the next test, which is the one that would have caught #200.
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body).toContain('<loc>https://tadeumendonca.io/en/me</loc>');
    await page.goto('/en/me');
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
  });

  // #200: EVERY advertised hreflang alternate must serve ITS OWN metadata, not merely respond 200.
  //
  // That distinction is the whole bug. x-default used to point at the bare, unprefixed URL for every
  // route; only the locale-prefixed routes plus the bare ROOT are prerendered, and CloudFront maps
  // 404 → /index.html with response code 200 — so five of six advertised x-defaults answered 200 carrying
  // the HOME page's og:title and canonical. A scraper pins that card permanently (ADR-0005). A
  // reachability check passes on all of them; only comparing the served canonical to the requested URL
  // fails. `scripts/routes.test.mjs` asserts the same invariant at build time, against the route module.
  test('every advertised hreflang alternate serves its OWN canonical, not the home page', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const advertised = [...new Set([...sitemap.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1]))];
    expect(advertised.length).toBeGreaterThan(1);

    const offenders: string[] = [];
    for (const url of advertised) {
      const path = new URL(url).pathname;
      // Request the DIRECTORY form. The prerender writes dist/<locale>/<route>/index.html; CloudFront's
      // viewer-request function rewrites a clean URL to it, but `vite preview` does not — without the
      // trailing slash it serves the SPA fallback locally and every route would look like the home page.
      // That is a local-harness artifact, not a production truth, so asking for the slash form keeps this
      // assertion about the ARTIFACT rather than about which server is under it. (per-locale.spec.ts
      // requests the same way, for the same reason.)
      const target = path === '/' || path.endsWith('/') ? path : `${path}/`;
      const html = await (await request.get(target)).text();
      const canonical = /rel="canonical" href="([^"]+)"/.exec(html)?.[1];
      // The bare origin legitimately canonicalizes to the English landing — it IS the x-default snapshot.
      const expected = path === '/' ? 'https://tadeumendonca.io/en' : url;
      if (canonical !== expected) offenders.push(`${path} → canonical=${canonical} (expected ${expected})`);
    }
    expect(offenders, `advertised URLs serving the wrong page:\n${offenders.join('\n')}`).toEqual([]);
  });

  // #170. The point of compiling at build time rather than in the browser is that a crawler with no
  // JavaScript sees the diagram. That is only provable with a RAW fetch of the prerendered artifact —
  // page.goto would run the app and pass whether or not the SVG was ever prerendered. Each edition is
  // checked for a label only IT has, which is what catches the en diagram being served on /pt.
  test('a JS-less crawler receives the architecture diagram, in the right language', async ({ request }) => {
    for (const [path, mine, theirs] of [
      ['/pt/architecture/', 'Leitor', 'Reader'],
      ['/en/architecture/', 'Reader', 'Leitor'],
    ]) {
      const html = await (await request.get(path)).text();
      expect(html, `${path} must carry inline SVG`).toContain('<svg');
      expect(html, `${path} must expose the diagram as an image role`).toContain('role="img"');
      expect(html, `${path} must render label text`).toContain(mine);
      expect(html, `${path} is serving the other edition's diagram`).not.toContain(theirs);
    }
  });

  // #272. The canonical is built from the ROUTE constant (useDocumentHead), never from the live URL, so
  // it is query-free by construction. This slice is what makes that load-bearing: until now no URL on
  // this site ever carried a query string, so sourcing the canonical from the location would have been a
  // harmless-looking refactor. Now it would split every shared article into a duplicate of itself in a
  // crawler's index, once per campaign parameter.
  //
  // Driven with page.goto rather than request.get, and that is the whole point of the test. A raw fetch
  // returns the PRERENDERED file, which was snapshotted at a query-free URL and whose head therefore
  // cannot contain a UTM whatever the client code does — so the refactor this guards against would leave
  // a request-level assertion GREEN. Only the hydrated page has ever seen the query string.
  test('a UTM-tagged arrival still advertises the clean canonical, og:url and hreflang', async ({ page, request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const article = [...sitemap.matchAll(/<loc>([^<]*\/blog\/[^<]+)<\/loc>/g)].map((m) => m[1])[0];
    expect(article, 'the sitemap must advertise at least one article to assert against').toBeTruthy();

    const path = new URL(article).pathname;
    await page.goto(`${path}/?utm_source=whatsapp&utm_medium=social&utm_campaign=reader-share`);
    // Proves the query string genuinely reached the running app — otherwise the assertions below would
    // hold vacuously, which is the failure mode this test was rewritten to escape.
    expect(new URL(page.url()).searchParams.get('utm_campaign')).toBe('reader-share');

    // Read from the LIVE head, not the response body: the share anchors legitimately contain utm_, so a
    // document-wide `not.toContain('utm_')` would fail on correct behaviour.
    const declared = await page.evaluate(() =>
      [
        ...document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]'),
      ].map((el) => el.getAttribute('href') ?? '')
        .concat([document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '']),
    );
    expect(declared.filter(Boolean).length, 'the article must declare a canonical, an og:url and hreflang').toBeGreaterThan(2);
    expect(declared.filter((u) => u.includes('utm_'))).toEqual([]);
  });
});
