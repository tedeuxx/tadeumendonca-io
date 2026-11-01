import { test, expect, type Browser } from '@playwright/test';

// /analytics — the event-schema page (#640). Acceptance 1–3, 6, 7 and 8, against the BUILT artifact.
//
// Head assertions read the SERVED HTML with a raw request, never the hydrated DOM: the prerendered bytes
// are what a scraper pins, and `page.goto` would pass on a head the client wrote after load whether or
// not the snapshot carried it. Paths are requested in DIRECTORY form (`/pt/analytics/`) because `vite
// preview` does not do the clean-URL rewrite — that is the edge function's job, proven in
// `edge-rewrite.spec.ts` — the same convention as `per-locale.spec.ts` and `seo.spec.ts`.
//
// The expected words are SPELLED OUT rather than imported from the catalog, so a wrong catalog entry
// cannot make its own assertion pass.
const SITE = 'https://tadeumendonca.io';

const EDITIONS = {
  pt: {
    title: 'Analytics — o que este site emite e o que cada evento prova · tadeumendonca.io',
    heading: 'O que cada evento consegue provar, e o que não consegue',
    section: 'Toda contagem é um piso',
    otherSection: 'Every count is a floor',
    card: `${SITE}/og-default.pt.png`,
  },
  en: {
    title: 'Analytics — what this site emits and what each event can prove · tadeumendonca.io',
    heading: 'What each event can prove, and what it cannot',
    section: 'Every count is a floor',
    otherSection: 'Toda contagem é um piso',
    card: `${SITE}/og-default.png`,
  },
} as const;

const LOCALES = ['pt', 'en'] as const;

test.describe('/analytics — the served head, per edition', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/analytics is prerendered with its own title, description, canonical, alternates and card`, async ({
      request,
    }) => {
      const e = EDITIONS[locale];
      const res = await request.get(`/${locale}/analytics/`);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toBe(e.title);
      expect(/property="og:title" content="([^"]*)"/.exec(html)?.[1]).toBe(e.title);
      const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
      expect(description.length, 'a meta description must be served').toBeGreaterThan(80);
      expect(/property="og:description" content="([^"]*)"/.exec(html)?.[1]).toBe(description);

      // Self-canonical, never cross-locale; reciprocal alternates; x-default on the English canonical
      // (a non-root static route — `routes.mjs` `alternatesFor`).
      expect(html).toContain(`rel="canonical" href="${SITE}/${locale}/analytics"`);
      expect(html).toContain(`hreflang="pt" href="${SITE}/pt/analytics"`);
      expect(html).toContain(`hreflang="en" href="${SITE}/en/analytics"`);
      expect(html).toContain(`hreflang="x-default" href="${SITE}/en/analytics"`);

      // The card in the reader's language, as the full attribute: `toContain('og-default')` would pass
      // on the English card and could not fail for the defect it is named after.
      expect(html).toContain(`property="og:image" content="${e.card}"`);
      expect(html).toContain('property="og:image:width" content="1200"');

      // The body is IN the snapshot — a JS-less crawler gets the page, not an empty shell — and it is
      // this edition's body, not the other one.
      expect(html).toContain(e.section);
      expect(html).not.toContain(e.otherSection);
      expect(html).toContain('article_end_reached');
    });
  }

  test('both editions are advertised in the sitemap, and the bare /analytics is not', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body).toContain(`<loc>${SITE}/pt/analytics</loc>`);
    expect(body).toContain(`<loc>${SITE}/en/analytics</loc>`);
    expect(body).not.toContain(`<loc>${SITE}/analytics</loc>`);
  });
});

test.describe('/analytics — reached from /architecture, in the right edition', () => {
  for (const locale of LOCALES) {
    test(`the link on /${locale}/architecture lands on /${locale}/analytics`, async ({ page }) => {
      await page.goto(`/${locale}/architecture`);
      await page.getByRole('link', { name: /^Analytics:/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/analytics/?$`));
      await expect(page.getByRole('heading', { level: 1, name: EDITIONS[locale].heading })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: EDITIONS[locale].section })).toBeVisible();
    });
  }
});

test.describe('/analytics — off the menu (decision 3)', () => {
  test('no menu control points at it', async ({ page }) => {
    await page.goto('/en/analytics');
    await expect(page.getByRole('heading', { level: 1, name: EDITIONS.en.heading })).toBeVisible();
    // Positive control first: the menu rendered and carries its usual entries, so the negative below is
    // a statement about a menu that exists rather than about an empty query.
    const menu = page.getByRole('navigation').first();
    await expect(menu.locator('a[href="/en/architecture"]').first()).toBeAttached();
    await expect(page.locator('nav a[href$="/analytics"]')).toHaveCount(0);
  });
});

// Acceptance 8: the page renders identically for every visitor. The prerender snapshots ONE browser and
// serves its HTML to everyone, so anything rendering off the visitor — language preference, stored
// state, viewport — would differ here. Two contexts that disagree on all three must render the same
// article.
async function articleText(browser: Browser, opts: { locale: string; viewport: { width: number; height: number }; seed: boolean }) {
  const context = await browser.newContext({ locale: opts.locale, viewport: opts.viewport });
  if (opts.seed) {
    await context.addInitScript(() => {
      window.localStorage.setItem('analytics-consent', 'denied');
      window.localStorage.setItem('locale', 'pt');
    });
  }
  const page = await context.newPage();
  await page.goto('/en/analytics');
  await expect(page.getByRole('heading', { level: 1, name: EDITIONS.en.heading })).toBeVisible();
  const text = await page.locator('article').first().innerText();
  await context.close();
  return text;
}

test('/en/analytics renders the same article for every visitor', async ({ browser }) => {
  const a = await articleText(browser, { locale: 'en-US', viewport: { width: 1280, height: 800 }, seed: false });
  const b = await articleText(browser, { locale: 'pt-BR', viewport: { width: 390, height: 844 }, seed: true });
  expect(a.length).toBeGreaterThan(1000);
  expect(b).toBe(a);
});
