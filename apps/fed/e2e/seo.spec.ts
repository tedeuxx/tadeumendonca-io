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
    // THE PT PROBE MOVED IN #448, and the reason is worth keeping: it used to be `Leitor`, which lived
    // in the request-path figure the restructure cut. `Reader` survived on the en side by accident — it
    // is in the layers figure too — so a naive fix would have left the pt half probing a word that is
    // now nowhere and reported it as "the wrong edition is being served". The pair is now `Dispositivo`
    // / `Reader`, both from the layers figure, and both were checked against the BUILT bytes to be
    // present in their own edition's SVG regions and absent from the other's — which is the property
    // this assertion needs and the one a source-level guess cannot establish.
    for (const [path, mine, theirs] of [
      ['/pt/architecture/', 'Dispositivo', 'Reader'],
      ['/en/architecture/', 'Reader', 'Dispositivo'],
    ]) {
      const html = await (await request.get(path)).text();
      expect(html, `${path} must carry inline SVG`).toContain('<svg');
      // The SVG carries its own accessible structure — a <title> from accTitle and a <desc> from
      // accDescr — and the <figure> carries the visible caption. Asserted rather than a role, because
      // the wrapper deliberately has none: role="img" is a leaf role and would hide both from a screen
      // reader, which is the opposite of why this is inline SVG at all.
      expect(html, `${path} must carry the diagram's own title/desc`).toMatch(/<title id="chart-title/);
      expect(html, `${path} must carry a visible caption`).toContain('<figcaption');
      // Scoped to the SVG regions, not the whole document — and this is a narrowing that makes the
      // assertion MORE precise rather than weaker. What it exists to catch is the en diagram being
      // served on /pt, so the diagram is where it should look. Over the whole page it also fired on any
      // English word appearing anywhere for a legitimate reason: #318 added the generated ADR index,
      // whose titles are canonical English document names, and ADR-0039's title contains "Reader". That
      // is a citation, not a mistranslation — a decision record has one name and it is the name it is
      // filed under, the same way a paper title is not translated when cited.
      const svgs = html.match(/<svg[\s\S]*?<\/svg>/g)?.join('') ?? '';
      expect(svgs, `${path} must carry inline SVG with content`).not.toBe('');
      expect(svgs, `${path} must render label text`).toContain(mine);
      expect(svgs, `${path} is serving the other edition's diagram`).not.toContain(theirs);
    }
  });

  // The version in the footer. Asserted on the SERVED bytes of several routes rather than in jsdom,
  // because both halves of the claim live there: that it is baked into the prerendered HTML (so a reader
  // with JS off sees it), and that it is on EVERY route rather than only the landing — the first
  // implementation put it in the landing colophon, so /architecture, the page it exists for, did not
  // have it. A component test cannot tell those apart.
  test('every route names the running build, in the served HTML', async ({ request }) => {
    const tagged = /releases\/tag\/v(\d+\.\d+\.\d+)/;
    const seen = new Set<string>();

    for (const path of ['/pt/', '/en/', '/pt/architecture/', '/en/me/']) {
      const html = await (await request.get(path)).text();
      const version = tagged.exec(html)?.[1];
      expect(version, `${path} must name the running build`).toBeTruthy();
      seen.add(version!);
    }
    // One build, one number. Divergence would mean the value is resolved per-route rather than baked.
    expect([...seen]).toHaveLength(1);
  });

  // ADR-0045 — a document title is an ADDRESS, and it must carry the name of the section the reader
  // clicked. Asserted on the SERVED bytes of every prerendered route in both locales, which is the only
  // place the two halves of the rule meet: the catalog holds a PREFIX (useDocumentHead appends
  // " · tadeumendonca.io"), and a unit test that stops at the key never sees the composed string a tab,
  // a bookmark or a SERP line actually shows.
  //
  // `<title>` and `og:title` are checked TOGETHER because they are one value with two blast radii. The
  // tab is free to fix; the OG title is pinned by every scraper that fetched the URL first (ADR-0041),
  // so a route where the two disagree means the head is being assembled twice and the irreversible copy
  // is the half nobody looked at.
  //
  // The lead words are spelled out rather than imported: this is the reader-visible string, and a test
  // that reads it from the same catalog the page reads cannot fail when the catalog is wrong.
  //
  // `/blog/:slug` is absent on purpose — an article is a document, not a section, so its own name IS its
  // address (ADR-0045). Its title is already pinned by the og:image:alt test below, which asserts the
  // og:title starts with the article's own alt.
  test('every route titles itself with the section the reader clicked, in both locales', async ({ request }) => {
    const routes = [
      // The exception, first: `/` is the site, not a section — no nav label to lead with, and the site
      // name is the whole title (useDocumentHead does not append a suffix it already contains).
      { path: '/pt/', title: 'tadeumendonca.io' },
      { path: '/en/', title: 'tadeumendonca.io' },
      { path: '/pt/me/', lead: 'Perfil' },
      { path: '/en/me/', lead: 'Profile' },
      { path: '/pt/portfolio/', lead: 'Portfólio' },
      { path: '/en/portfolio/', lead: 'Portfolio' },
      { path: '/pt/library/', lead: 'Biblioteca' },
      { path: '/en/library/', lead: 'Library' },
      { path: '/pt/ramp-up/', lead: 'Ramp-up' },
      { path: '/en/ramp-up/', lead: 'Ramp-up' },
      // The reported defect: the tab said "Como este site é construído" and never said "Arquitetura".
      { path: '/pt/architecture/', lead: 'Arquitetura' },
      { path: '/en/architecture/', lead: 'Architecture' },
    ];

    const offenders: string[] = [];
    for (const route of routes) {
      const html = await (await request.get(route.path)).text();
      const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
      const og = /property="og:title" content="([^"]*)"/.exec(html)?.[1];

      if (!title) offenders.push(`${route.path} → no <title>`);
      else if ('title' in route && title !== route.title) offenders.push(`${route.path} → "${title}" ≠ "${route.title}"`);
      else if ('lead' in route && !title.startsWith(route.lead!))
        offenders.push(`${route.path} → "${title}" does not lead with "${route.lead}"`);
      // Composed, not the bare key: the site name is appended to every section title.
      else if ('lead' in route && !title.endsWith(' · tadeumendonca.io'))
        offenders.push(`${route.path} → "${title}" is missing the appended site name`);
      if (og !== title) offenders.push(`${route.path} → og:title "${og}" ≠ <title> "${title}"`);
    }
    expect(offenders, `routes whose title is not their address:\n${offenders.join('\n')}`).toEqual([]);
  });

  // #269. Each article advertises its OWN card, per locale, and the card RESOLVES.
  //
  // The 200 is the point, not decoration. A per-article `og:image` that 404s is the least reversible
  // failure this site can ship: the page looks fine, nothing goes red, and every scraper that fetched
  // the miss has pinned it — the merge that adds the file does not fix the post that already unfurled.
  // So the assertion follows the advertised URL rather than trusting that the generator ran.
  test('every article advertises its own OG card, per locale, and the card resolves', async ({ request }) => {
    const seen = new Set<string>();

    for (const path of ['/pt/blog/meu-compromisso/', '/en/blog/my-commitment/']) {
      const html = await (await request.get(path)).text();
      const card = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
      expect(card, `${path} must advertise an og:image`).toBeTruthy();
      expect(card, `${path} must not fall back to the site-wide card`).not.toContain('og-default');

      const res = await request.get(new URL(card!).pathname);
      expect(res.status(), `${path} advertises ${card} — which does not resolve`).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
      seen.add(card!);
    }

    // Two editions, two cards. One shared card would satisfy every assertion above and defeat the
    // feature, whose entire purpose is that two shared articles stop looking like the same link.
    expect(seen.size, 'the two editions must not share one card').toBe(2);
  });

  // #167. The card being DISTINCT is only half of what makes a reader tell two links apart — the other
  // half is it rendering at the size where the difference is visible. Without the dimension block,
  // WhatsApp and LinkedIn fetch first and guess, and they guess the small square thumbnail. That is the
  // state #269 shipped in: the article got its own card and lost these four tags in the same commit.
  //
  // The alt is asserted to be the ARTICLE'S TITLE, not the default card's sentence. Emitting the latter
  // over an article card would describe a picture the reader is not being shown, to the one reader who
  // cannot check.
  test('an article card is declared at its real size, and described by its own title', async ({ request }) => {
    const html = await (await request.get('/pt/blog/meu-compromisso/')).text();
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:type" content="image/png"');

    const alt = /property="og:image:alt" content="([^"]+)"/.exec(html)?.[1];
    const title = /property="og:title" content="([^"]+)"/.exec(html)?.[1];
    expect(alt, 'the article card must carry alt text').toBeTruthy();
    expect(title?.startsWith(alt!), `og:image:alt "${alt}" must describe THIS article, not the default card`).toBe(
      true,
    );
    expect(alt).not.toContain('aprenda a construir');
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
