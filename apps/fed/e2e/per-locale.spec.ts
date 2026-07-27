import { test, expect } from '@playwright/test';

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

// 4 · hreflang reciprocity + self-canonical — each locale page lists pt + en + x-default with ABSOLUTE
// URLs; the canonical is SELF, never cross-locale; both editions advertise the SAME alternate set.
test.describe('hreflang reciprocity + self-canonical', () => {
  const ALT = {
    pt: `hreflang="pt" href="${SITE}/pt/me"`,
    en: `hreflang="en" href="${SITE}/en/me"`,
    xDefault: `hreflang="x-default" href="${SITE}/me"`,
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
// OWN slug and advertises the reciprocal hreflang pair, x-default → the bare ENGLISH slug. The old shared
// EN URL `/en/blog/meu-compromisso` is a client-side not-found (never prerendered, never in the sitemap).
test.describe('per-locale article slugs', () => {
  const EN_ART = `${SITE}/en/blog/my-commitment`;
  const PT_ART = `${SITE}/pt/blog/meu-compromisso`;
  const ALT = {
    pt: `hreflang="pt" href="${PT_ART}"`,
    en: `hreflang="en" href="${EN_ART}"`,
    xDefault: `hreflang="x-default" href="${SITE}/blog/my-commitment"`,
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
