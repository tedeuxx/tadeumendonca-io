import { test, expect } from '@playwright/test';
import { LOCALE_OFFER_LABEL, LOCALE_OFFER_LABELS } from './locale-offer-labels';

// Per-locale URLs (ADR-0036). Every public route is served under a first-class locale prefix — /pt/… and
// /en/… — each with its own prerendered, self-canonical, OG-complete HTML and reciprocal hreflang
// alternates. The bare/unprefixed URL client-side redirects to the detected locale (path → persisted →
// navigator → en), preserving the sub-path; the bare-root snapshot is an x-default English page for the
// JS-less crawler. There is NO edge/Accept-Language logic — the redirect is pure client-side React
// (ADR-0004 holds).
//
// These journeys fold in the plan-reviewer's extra assertions. The served-HTML checks inspect the raw HTTP
// BODY (request.get, no JS) so they prove the PRERENDERED per-locale file was served, not the generic SPA
// shell falling through — the same anti-masquerade rigor as seo.spec.ts. The discriminator is decisive: the
// x-default shell carries en (lang, og:locale, canonical), so a pt file that were really the shell would
// fail every pt assertion.

const SITE = 'https://tadeumendonca.io';

// A distinctive pt-only vs en-only marker inside the profile summary (the /me og:description source).
const PT_ONLY = /aplicando desenvolvimento AI-native/;
const EN_ONLY = /applying AI-native development/;

// 1 · Path beats the browser AND a persisted preference — a shared /pt/… link wins over everything.
test.describe('the path is authoritative', () => {
  test.describe('en-US browser context', () => {
    test.use({ locale: 'en-US' });

    test('/pt/me resolves in Portuguese even in an English browser (path beats browser)', async ({ page }) => {
      await page.goto('/pt/me');
      await expect(page).toHaveURL(/\/pt\/me$/); // no redirect away — the path stands
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible(); // a pt-only string
      await expect(page.getByText(/\d+\+ years across SDLC/)).toHaveCount(0); // the en counterpart absent
    });

    test('/pt/me resolves in Portuguese even with a persisted en preference (path beats localStorage)', async ({
      page,
    }) => {
      // Seed a persisted 'en' override BEFORE the app loads: the path must still win.
      await page.addInitScript(() => window.localStorage.setItem('locale', 'en'));
      await page.goto('/pt/me');
      await expect(page).toHaveURL(/\/pt\/me$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible();
    });
  });

  // 2 · The mirror: /en/me resolves in English inside a pt-BR browser.
  test.describe('pt-BR browser context', () => {
    test.use({ locale: 'pt-BR' });

    test('/en/me resolves in English even in a Portuguese browser', async ({ page }) => {
      await page.goto('/en/me');
      await expect(page).toHaveURL(/\/en\/me$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByText(/\d+\+ years across SDLC/)).toBeVisible();
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toHaveCount(0);
    });
  });
});

// 3 · Served-HTML (JS-off) per locale — the prerendered file carries the right lang / og:locale /
// og:description / self-canonical, and it is the PRERENDERED page, not the SPA shell (which is en).
//
// The requests use a TRAILING SLASH (`/pt/me/`): the CloudFront rewrite maps both `/pt/me` and `/pt/me/`
// to `/pt/me/index.html` in production, and the trailing slash also makes `vite preview` (sirv) resolve the
// directory index locally — so the SAME raw-HTTP assertion proves the prerendered file in both. A CLEAN
// `/pt/me` under vite preview falls through to the SPA shell (no rewrite), which would mask the check.
test.describe('served-HTML is prerendered per locale', () => {
  test('/pt/me serves Portuguese prerendered HTML, not the en shell', async ({ request }) => {
    const body = await (await request.get('/pt/me/')).text();
    expect(body).toMatch(/<html[^>]*lang="pt-BR"/);
    expect(body).toContain('property="og:locale" content="pt_BR"');
    expect(body).toContain(`rel="canonical" href="${SITE}/pt/me"`);
    // og:description is the Portuguese edition.
    expect(body).toMatch(new RegExp(`property="og:description" content="[^"]*${PT_ONLY.source}`));
    // Anti-masquerade: this is NOT the x-default English shell falling through.
    expect(body).not.toContain('property="og:locale" content="en_US"');
    expect(body).not.toContain(`rel="canonical" href="${SITE}/en/me"`);
  });

  test('/en/me serves English prerendered HTML', async ({ request }) => {
    const body = await (await request.get('/en/me/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain('property="og:locale" content="en_US"');
    expect(body).toContain(`rel="canonical" href="${SITE}/en/me"`);
    expect(body).toMatch(new RegExp(`property="og:description" content="[^"]*${EN_ONLY.source}`));
    expect(body).not.toContain('property="og:locale" content="pt_BR"');
  });
});

// 3b · The PORTFOLIO body is per-locale too (#235). The head was already right — og:locale, canonical,
// hreflang all localized — while the page's own copy was Portuguese in both editions, because
// `catalog.ts` typed its prose as plain strings. So a head-only check would have passed on the defect;
// this asserts the BODY, in both directions, on the built artifact where the bug actually lived.
test.describe('the portfolio body is per-locale', () => {
  // One assertion per prose field, both directions. `proof` is covered explicitly because the first
  // version of this guard asserted only `tagline` and `description` — so a `proof` that regressed to
  // Portuguese on /en would have matched no negative and left the E2E green, one layer above where the
  // unit test catches it. Partial coverage of a three-field defect is how the three days happened.
  test('/en/portfolio serves English copy and no Portuguese', async ({ request }) => {
    const body = await (await request.get('/en/portfolio/')).text();
    expect(body).toContain('This site — a static React/Vite SPA'); // tagline
    expect(body).toContain('agent-driven SDLC'); // description
    expect(body).toContain('how an agent-driven SDLC actually closes'); // proof
    expect(body).toContain('The bar for getting listed here'); // the bar (#246)
    expect(body).not.toContain('Este site — SPA estático');
    expect(body).not.toContain('entregue por um SDLC');
    expect(body).not.toContain('se fecha na prática');
    expect(body).not.toContain('A régua para entrar aqui');
  });

  test('/pt/portfolio serves Portuguese copy and no English', async ({ request }) => {
    const body = await (await request.get('/pt/portfolio/')).text();
    expect(body).toContain('Este site — SPA estático'); // tagline
    expect(body).toContain('entregue por um SDLC'); // description
    expect(body).toContain('se fecha na prática'); // proof
    expect(body).toContain('A régua para entrar aqui'); // the bar (#246)
    expect(body).not.toContain('This site — a static React/Vite SPA');
    expect(body).not.toContain('how an agent-driven SDLC actually closes');
    expect(body).not.toContain('The bar for getting listed here');
  });

  // The bar's LINK, asserted on the served artifact rather than only in the unit test — the sentence
  // claims the standard is checkable, and a claim whose link never shipped is the claim failing, not a
  // cosmetic miss. Asserted in both editions because the href is authored once and shared: a defect here
  // would be identical in both, which is exactly the kind that a single-edition check reports as fine.
  const BAR_HREF = 'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md';
  for (const locale of ['pt', 'en'] as const) {
    test(`/${locale}/portfolio serves the bar's link, not just its sentence`, async ({ request }) => {
      const body = await (await request.get(`/${locale}/portfolio/`)).text();
      expect(body).toContain(BAR_HREF);
    });
  }

  // The LANDING must NOT carry it — the shape proposed in PR #251. `PortfolioSection` is shared, so the bar
  // reached the storefront for free and the default had to be flipped to opt-in to stop it. This is the
  // assertion that makes that decision durable: it is one prop away from regressing, and the landing is
  // the surface where a correction costs most (CloudFront, plus the OG card scrapers pin on first fetch).
  //
  // Asserted on the served artifact rather than in the unit test alone, because the bare `/` snapshot is
  // what the JS-less crawler reads and it is prerendered separately from the locale landings.
  for (const path of ['/', '/pt/', '/en/'] as const) {
    test(`${path} (the landing) does not carry the curation claim`, async ({ request }) => {
      const body = await (await request.get(path)).text();
      expect(body).not.toContain('A régua para entrar aqui');
      expect(body).not.toContain('The bar for getting listed here');
      expect(body).not.toContain(BAR_HREF);
    });
  }
});

// 4 · hreflang reciprocity + self-canonical — each locale page lists pt + en + x-default with ABSOLUTE
// URLs; the canonical is SELF, never cross-locale; both editions advertise the SAME alternate set.
test.describe('hreflang reciprocity + self-canonical', () => {
  // x-default is the PREFIXED English URL (#200). It used to be the bare `/me`, which the prerender never
  // snapshots — CloudFront answers it 200 from /index.html, i.e. with the HOME page's OG card.
  const ALT = {
    pt: `hreflang="pt" href="${SITE}/pt/me"`,
    en: `hreflang="en" href="${SITE}/en/me"`,
    xDefault: `hreflang="x-default" href="${SITE}/en/me"`,
  };

  test('the pt edition lists the full alternate set and self-canonicals', async ({ request }) => {
    const body = await (await request.get('/pt/me/')).text();
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
    expect(body).toContain(`rel="canonical" href="${SITE}/pt/me"`); // self, not /en/me
  });

  test('the en edition lists the SAME alternate set and self-canonicals', async ({ request }) => {
    const body = await (await request.get('/en/me/')).text();
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
    expect(body).toContain(`rel="canonical" href="${SITE}/en/me"`); // self, not /pt/me
  });
});

// 4b · Per-locale ARTICLE slugs (ADR-0037, this issue): the two editions live at DIFFERENT slugs — EN
// `/en/blog/my-commitment`, PT `/pt/blog/meu-compromisso`. Each prerendered edition self-canonicals to its
// OWN slug and advertises the reciprocal hreflang pair. The old shared EN URL `/en/blog/meu-compromisso`
// is a client-side not-found (never prerendered, never in the sitemap).
//
// x-default is the PREFIXED English article URL (#200). The bare `/blog/my-commitment` was worse than
// merely un-snapshotted: unprefixed paths redirect PRESERVING the path and slugs are per-locale, so a
// pt-BR reader following it landed on `/pt/blog/my-commitment` — a route that does not exist — and fell
// through to the blog listing. It never reached the article at all.
test.describe('per-locale article slugs', () => {
  const EN_ART = `${SITE}/en/blog/my-commitment`;
  const PT_ART = `${SITE}/pt/blog/meu-compromisso`;
  const ALT = {
    pt: `hreflang="pt" href="${PT_ART}"`,
    en: `hreflang="en" href="${EN_ART}"`,
    xDefault: `hreflang="x-default" href="${EN_ART}"`,
  };

  test('the en edition self-canonicals to its own slug and lists the reciprocal pair', async ({ request }) => {
    const body = await (await request.get('/en/blog/my-commitment/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain(`rel="canonical" href="${EN_ART}"`); // self, English slug
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
  });

  test('the pt edition self-canonicals to its own slug and lists the SAME reciprocal pair', async ({ request }) => {
    const body = await (await request.get('/pt/blog/meu-compromisso/')).text();
    expect(body).toMatch(/<html[^>]*lang="pt-BR"/);
    expect(body).toContain(`rel="canonical" href="${PT_ART}"`); // self, Portuguese slug
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
  });

  test('the old shared EN slug /en/blog/meu-compromisso is an in-app not-found', async ({ page }) => {
    await page.goto('/en/blog/meu-compromisso');
    // The article body never renders; the not-found notice does (English chrome).
    await expect(page.getByRole('heading', { level: 1, name: /My Commitment/ })).toHaveCount(0);
    await expect(page.getByText(/does not exist or is not published/i)).toBeVisible();
  });

  // #204 — the UNPREFIXED article URL must reach the article in BOTH locales. It is the "clean" form a
  // human types or shares, and it is what was advertised as x-default until #200. Because the redirect
  // re-prefixed the path verbatim while slugs are per-locale, a pt-BR reader following the English slug
  // landed on `/pt/blog/my-commitment` — nonexistent — and fell through to the landing. An English reader
  // got the article, so the bug was invisible to the person most likely to test it.
  test('a bare article URL reaches the article for a pt-BR reader, mapping the slug', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'pt-BR' });
    const page = await ctx.newPage();
    await page.goto('/blog/my-commitment'); // the ENGLISH slug, unprefixed
    await expect(page).toHaveURL(/\/pt\/blog\/meu-compromisso$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Meu Compromisso' })).toBeVisible();
    await ctx.close();
  });

  test('a bare article URL reaches the article for an English reader, mapping the slug', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto('/blog/meu-compromisso'); // the PORTUGUESE slug, unprefixed
    await expect(page).toHaveURL(/\/en\/blog\/my-commitment$/);
    await expect(page.getByRole('heading', { level: 1, name: 'My Commitment' })).toBeVisible();
    await ctx.close();
  });

  test('a bare article URL with an unknown slug still falls to the in-locale not-found', async ({ page }) => {
    await page.goto('/blog/no-such-article');
    await expect(page.getByText(/does not exist or is not published/i)).toBeVisible();
  });
});

// 5 · x-default served-HTML — the bare-root snapshot is English, OG-complete, hreflang x-default → the bare
// origin.
test.describe('x-default root snapshot', () => {
  test('serves an English, OG-complete x-default page at bare /', async ({ request }) => {
    const body = await (await request.get('/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain('property="og:locale" content="en_US"');
    expect(body).toContain(`hreflang="x-default" href="${SITE}/"`);
    expect(body).toContain(`hreflang="pt" href="${SITE}/pt"`);
    expect(body).toContain(`hreflang="en" href="${SITE}/en"`);
    // OG-complete: title, image + wide-card dimensions present.
    expect(body).toContain('property="og:title"');
    expect(body).toContain('property="og:image" content="' + SITE + '/og-default.png"');
    expect(body).toContain('property="og:image:width" content="1200"');
  });
});

// 6 · The bare-root redirect preserves the sub-path, per detected locale.
test.describe('bare-root redirect preserves the sub-path', () => {
  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });
    test('/me → /pt/me and bare / → /pt', async ({ page }) => {
      await page.goto('/me');
      await expect(page).toHaveURL(/\/pt\/me$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt$/);
    });
  });

  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });
    test('/me → /en/me and bare / → /en', async ({ page }) => {
      await page.goto('/me');
      await expect(page).toHaveURL(/\/en\/me$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/en$/);
    });
  });
});

// 7 · The locale OFFER (#172). A shared link pins the sharer's language (ADR-0036), so a pt-BR reader can
// land on `/en/...` with no obvious way back. The offer surfaces the switch WITHOUT taking the decision:
// the link keeps working as sent, and the reader opts in.
test.describe('locale offer on a link that pins the other language', () => {
  test.describe('a pt-BR reader on an English link', () => {
    test.use({ locale: 'pt-BR' });

    test('is offered Portuguese, and accepting lands on the sibling URL', async ({ page }) => {
      await page.goto('/en/me/');
      const offer = page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt });
      await expect(offer).toBeVisible();
      // Written in the reader's language, not the page's — the whole point is that they may not read
      // the page's language.
      await expect(offer).toHaveAttribute('lang', 'pt-BR');

      await offer.getByRole('button', { name: 'Ler em português' }).click();
      await expect(page).toHaveURL(/\/pt\/me\/?$/);
      // Same logical route, not the landing.
      await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
      // Not re-offered on the edition just chosen.
      await expect(page.getByRole('region', { name: new RegExp(LOCALE_OFFER_LABELS.join('|')) })).toHaveCount(0);
    });

    test('is not offered again after dismissing, on this or another page', async ({ page }) => {
      await page.goto('/en/me/');
      await page.getByRole('button', { name: 'Continuar em inglês' }).click();
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
      await page.goto('/en/portfolio/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
    });

    // The branch the plan-review flagged as most likely to regress silently: a reader who CHOSE the
    // English edition with the toggle is reading it on purpose, and must not be second-guessed. Driven
    // through the real toggle rather than by seeding localStorage, so it exercises the same write the
    // product does.
    test('is not offered when the reader chose this edition with the toggle', async ({ page }) => {
      await page.goto('/pt/me/');
      await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'EN' }).click();
      await expect(page).toHaveURL(/\/en\/me\/?$/);
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
    });
  });

  test.describe('an en-US reader on the English edition', () => {
    test.use({ locale: 'en-US' });
    test('is offered nothing — the page is already their language', async ({ page }) => {
      await page.goto('/en/me/');
      await expect(page.getByRole('region', { name: new RegExp(LOCALE_OFFER_LABELS.join('|')) })).toHaveCount(0);
    });
  });
});

// 8 · Sitemap drift guard — one <loc> per (locale, route) plus the x-default root, each with xhtml:link
// alternates, and no retired/redirect paths.
test.describe('sitemap advertises every per-locale URL', () => {
  // Shared-slug routes: the same logical path under both prefixes.
  const SHARED = ['/', '/me', '/portfolio', '/ramp-up', '/architecture'];
  // The one article carries a PER-LOCALE slug (ADR-0037), so its two <loc>s do NOT share a path.
  const ARTICLE = { pt: `${SITE}/pt/blog/meu-compromisso`, en: `${SITE}/en/blog/my-commitment` };
  const LOGICAL_COUNT = SHARED.length + 1; // + the article

  test('lists routes × locales + x-default, with alternates and no retired paths', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body).toContain('xmlns:xhtml=');

    for (const route of SHARED) {
      const pt = route === '/' ? `${SITE}/pt` : `${SITE}/pt${route}`;
      const en = route === '/' ? `${SITE}/en` : `${SITE}/en${route}`;
      expect(body).toContain(`<loc>${pt}</loc>`);
      expect(body).toContain(`<loc>${en}</loc>`);
    }
    // The article's per-locale <loc>s.
    expect(body).toContain(`<loc>${ARTICLE.pt}</loc>`);
    expect(body).toContain(`<loc>${ARTICLE.en}</loc>`);
    // The old shared-slug EN URL is NEVER advertised (it is a not-found now).
    expect(body).not.toContain(`<loc>${SITE}/en/blog/meu-compromisso</loc>`);
    // The x-default homepage entry.
    expect(body).toContain(`<loc>${SITE}/</loc>`);

    // Every <url> carries alternates.
    const locCount = (body.match(/<loc>/g) ?? []).length;
    const altCount = (body.match(/xhtml:link/g) ?? []).length;
    expect(locCount).toBe(LOGICAL_COUNT * 2 + 1); // routes × locales + x-default root
    expect(altCount).toBe(locCount * 3); // pt · en · x-default per <url>

    // No retired/redirect paths, and no UNPREFIXED locale routes advertised (only the x-default root is bare).
    expect(body).not.toContain('/articles');
    expect(body).not.toContain('/profile');
    expect(body).not.toContain(`<loc>${SITE}/cv</loc>`);
    expect(body).not.toContain(`<loc>${SITE}/me</loc>`); // bare /me is a redirect, never a <loc>
    expect(body).not.toContain(`<loc>${SITE}/blog</loc>`);
  });
});

// 9 · PDF single-source — one downloadable CV, the English canonical (ADR-0024/0034). Both /me editions
// point at the SAME static /cv.pdf asset (not a per-locale PDF), and it is a real PDF.
// The prerender snapshots every route in an en-US browser, so anything rendering off the VISITOR rather
// than the route leaks that browser's identity into HTML served to everyone. The locale offer (#172) is
// the first such component, and it did leak: the initial implementation gated on a post-mount flag, which
// this prerender defeats by construction — it snapshots a live, already-hydrated page.
//
// Asserted against the SHIPPED HTML rather than in a component test, because that is where the defect
// existed: every unit test passed while `dist/pt/**` carried an offer to read in English.
test.describe('the prerendered HTML carries nothing visitor-specific', () => {
  // The LIVENESS legs. The guard's real assertion is negative, and a negative assertion never fails on a
  // bad selector: rename `localeSuggestion.notice` and the greps below search for a string that exists
  // nowhere, and pass having checked nothing (#231). So each label is first proven live on a page where
  // the offer MUST appear, matching the exact value the grep will use.
  //
  // BOTH directions, deliberately. The first version of this proved only `pt`, which left the `en` label
  // in exactly the state this exists to fix — and English is the canonical edition (ADR-0024), so an
  // English-only copy edit is the MORE likely one, and it was the one still unguarded.
  const STALE = 'the offer label changed — update e2e/locale-offer-labels.ts, or the absence check below verifies nothing';

  test.describe('a pt-BR reader on the English edition', () => {
    test.use({ locale: 'pt-BR' });
    test('still sees the Portuguese offer label', async ({ page }) => {
      await page.goto('/en/me/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt }), STALE).toBeVisible();
    });
  });

  test.describe('an en-US reader on the Portuguese edition', () => {
    test.use({ locale: 'en-US' });
    test('still sees the English offer label', async ({ page }) => {
      await page.goto('/pt/me/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.en }), STALE).toBeVisible();
    });
  });

  test('no locale-suggestion offer is baked into either edition', async ({ request }) => {
    for (const path of ['/pt/', '/en/', '/pt/me/', '/en/me/']) {
      const html = await (await request.get(path)).text();
      // Both directions: the pt snapshot must not offer English, and the en snapshot must not offer
      // Portuguese. Matching the aria-label catches the region whatever the button copy becomes.
      for (const label of LOCALE_OFFER_LABELS) {
        expect(html, `${path} carries a baked locale offer`).not.toContain(label);
      }
    }
  });
});

test.describe('the CV PDF is a single English-canonical asset', () => {
  test('both /me editions link the one shared /cv.pdf', async ({ page }) => {
    await page.goto('/en/me');
    await expect(page.getByRole('link', { name: /Download CV|Baixar/ }).first()).toHaveAttribute('href', '/cv.pdf');
    await page.goto('/pt/me');
    await expect(page.getByRole('link', { name: /Download CV|Baixar/ }).first()).toHaveAttribute('href', '/cv.pdf');
  });

  test('/cv.pdf is a real PDF, not the SPA shell', async ({ request }) => {
    const body = await (await request.get('/cv.pdf')).body();
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
