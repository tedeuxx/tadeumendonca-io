import { test, expect } from '@playwright/test';

// The delivery-economics section on /architecture (#691, ADR-0055), against the BUILT artifact.
//
// The served-HTML half reads the prerendered bytes with a raw request, never the hydrated DOM, because the
// bytes are what a JS-less crawler and a scraper get: the period and `as_of` must be IN the snapshot, so stale
// data cannot read as current to a reader who never runs the bundle. Paths are requested in directory form
// (`/pt/architecture/`) because `vite preview` does not do the clean-URL rewrite, the same convention as
// `analytics-schema.spec.ts`.
//
// The expected words are SPELLED OUT rather than imported from the catalog, so a wrong catalog entry cannot
// make its own assertion pass. They describe the first committed period, October 2026, as it stands with the
// spend pending; attesting the spend changes the pending phrases, and that change is the moment to edit them.
const EDITIONS = {
  pt: {
    period: 'Período: outubro de 2026 · dados de 21 de nov. de 2026',
    pending: 'Atestação pendente',
    notInstrumented: 'Ainda sem instrumento',
    coverage: 'Consumo nativo informado: 0 de 4 execuções registradas',
    other: 'Not yet instrumented',
  },
  en: {
    period: 'Period: October 2026 · data as of Nov 21, 2026',
    pending: 'Pending attestation',
    notInstrumented: 'Not yet instrumented',
    coverage: 'Native usage reported: 0 of 4 recorded runs',
    other: 'Ainda sem instrumento',
  },
} as const;

const LOCALES = ['pt', 'en'] as const;

test.describe('/architecture — the delivery-economics section is in the served HTML', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/architecture carries the period, as_of, coverage and every unknown as a labelled state`, async ({
      request,
    }) => {
      const e = EDITIONS[locale];
      const res = await request.get(`/${locale}/architecture/`);
      expect(res.status()).toBe(200);
      // Collapse the prerender's whitespace and the non-breaking space Intl puts in some dates.
      const html = (await res.text()).replace(/\u00a0/g, ' ');

      expect(html).toContain('data-economics="true"');
      expect(html).toContain(e.period);
      expect(html).toContain(e.coverage);
      expect(html).toContain(e.pending);
      expect(html).toContain(e.notInstrumented);
      // This edition's words, not the other one's.
      expect(html).not.toContain(e.other);
      // The producer command ships with the coverage it measured.
      expect(html).toContain('npm --prefix apps/fed run gen-economics -- --period 2026-10');
      // All three providers, Kiro included, each with its own card.
      for (const provider of ['anthropic', 'openai', 'kiro']) expect(html).toContain(`data-economics-provider="${provider}"`);
      // Fourteen axes, each rendered as a state.
      const scorecard = html.slice(html.indexOf('data-economics-scorecard'));
      expect(scorecard.match(/data-economics-state="/g)?.length).toBe(14);
    });
  }
});

test.describe('/architecture — the section asks nothing of anyone else', () => {
  test('rendering the page makes no request off the origin before consent', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const off: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && url.origin !== origin) off.push(url.origin);
    });
    await page.goto('/en/architecture/');
    await expect(page.locator('[data-economics]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(off).toEqual([]);
  });

  test('the section does not push the page sideways at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/pt/architecture/');
    const section = page.locator('[data-economics]');
    await section.scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
