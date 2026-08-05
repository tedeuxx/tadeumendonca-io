import { test, expect } from '@playwright/test';

// The Biblioteca / Library surface (#166), slice 1 — the route exists, in both editions, with zero
// entries and a deliberate empty state.
//
// WHY EVERY ASSERTION HERE ANCHORS ON THE EMPTY-STATE SENTENCE RATHER THAN ON A 200, and this is the
// whole reason the file is written the way it is: `vite preview` falls a missing path through to
// `index.html`, and CloudFront maps 404 → /index.html with response code 200 (iac/frontend.tf). So a
// route that does not exist, a route whose data import broke, and a route that is intentionally empty
// all answer 200 with HTML. The only thing that separates them is a string only this page can produce.
// `routes.spec.ts` already reasons this way for the catalog ("an empty catalog renders the fallback copy
// instead, which would silently pass a laxer assertion"); this is the same rigor on a page whose CORRECT
// state is the empty one, which is the harder case.
//
// The nav has no Library entry on day 1 (owner, 2026-08-05) — the surface is reachable by direct URL and
// the sitemap until it has content, since linking readers at an empty page is worse than not linking. So
// there is deliberately no "reaches it from the nav" journey here, unlike /ramp-up and /architecture.

const SITE = 'https://tadeumendonca.io';

// The empty-state sentence per edition. Pinned as literals rather than read from the catalog: this suite
// runs against a BUILT artifact, and importing the catalog would assert that the page renders whatever
// the source says — which is true of a stale build too.
const EMPTY = {
  pt: 'A estante ainda está sendo montada.',
  en: 'The shelf is still being put together.',
};

test.describe('/library serves the deliberate empty state, in both editions', () => {
  for (const [locale, heading, empty, other] of [
    ['pt', /Biblioteca/, EMPTY.pt, EMPTY.en],
    ['en', /Library/, EMPTY.en, EMPTY.pt],
  ] as const) {
    test(`/${locale}/library renders the ${locale} shelf, empty and saying so`, async ({ page }) => {
      await page.goto(`/${locale}/library`);
      // The URL stands — no redirect away, which is what would happen if the route did not exist.
      await expect(page).toHaveURL(new RegExp(`/${locale}/library$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      // THE ASSERTION THAT DISTINGUISHES THIS FROM A FALLTHROUGH 200.
      await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(empty));
      // And the parity rule: the other edition's copy must be ABSENT, not merely outnumbered. A build
      // that rendered both, or the wrong locale, passes a presence-only check.
      await expect(page.getByText(other)).toHaveCount(0);
    });
  }

  // A JS-LESS CRAWLER GETS IT. `page.goto` runs the app and would pass whether or not the route was ever
  // prerendered — the trap #170 recorded for the diagrams and #200 for hreflang. This inspects the raw
  // HTTP body, so it proves the per-locale FILE was written by the prerender rather than the SPA shell
  // falling through: the shell is the English landing, so its bytes carry neither of these sentences.
  for (const [locale, empty] of [
    ['pt', EMPTY.pt],
    ['en', EMPTY.en],
  ] as const) {
    test(`the ${locale} edition is in the prerendered bytes, not only after hydration`, async ({ request }) => {
      const html = await (await request.get(`/${locale}/library/`)).text();
      expect(html, 'the empty state must be in the served HTML').toContain(empty);
      expect(html, 'self-canonical, never cross-locale').toContain(`<link rel="canonical" href="${SITE}/${locale}/library"`);
    });
  }

  // hreflang reciprocity on the SERVED artifact. Both editions must advertise the SAME set, and every
  // member must be a URL the build snapshots — the #200 invariant. The bare `/library` in particular is
  // never advertised: it is a client-side redirect, so a crawler following it reads the home page's OG
  // card and pins it permanently (ADR-0005).
  test('both editions advertise the same alternates, and never the bare path', async ({ request }) => {
    for (const locale of ['pt', 'en'] as const) {
      const html = await (await request.get(`/${locale}/library/`)).text();
      expect(html).toContain(`hreflang="pt" href="${SITE}/pt/library"`);
      expect(html).toContain(`hreflang="en" href="${SITE}/en/library"`);
      expect(html).toContain(`hreflang="x-default" href="${SITE}/en/library"`);
      expect(html, 'the bare path is not prerendered and must never be advertised').not.toContain(
        `href="${SITE}/library"`,
      );
    }
  });
});

test.describe('/library resolves from every direction a reader arrives by', () => {
  // The PT/EN toggle. It stays ON the surface rather than dropping the reader on the landing — which is
  // what a route the toggle cannot map does, silently, via the in-locale `*`.
  test('the toggle carries the reader across editions without leaving the page', async ({ page }) => {
    await page.goto('/pt/library');
    await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/library$/);
    await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(EMPTY.en));

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'PT' }).click();
    await expect(page).toHaveURL(/\/pt\/library$/);
    await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(EMPTY.pt));
  });

  // The unprefixed path — the shape an old bookmark or a hand-typed URL takes. It is NOT prerendered and
  // must never be advertised, but it must resolve, in the reader's own edition (ADR-0036).
  test.describe('a pt-BR reader', () => {
    test.use({ locale: 'pt-BR' });
    test('reaches the Portuguese edition from the unprefixed path', async ({ page }) => {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/pt\/library$/);
      await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(EMPTY.pt));
    });
  });

  test.describe('an en-US reader', () => {
    test.use({ locale: 'en-US' });
    test('reaches the English edition from the unprefixed path', async ({ page }) => {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/en\/library$/);
      await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(EMPTY.en));
    });

    // The path beats the browser (ADR-0036), on this surface too. An en-US browser opening a shared
    // `/pt/library` link keeps Portuguese — which is the property the owner's requirement named, and the
    // reason the localized slug pair was not needed to deliver it.
    test('still gets Portuguese from a shared /pt/library link', async ({ page }) => {
      await page.goto('/pt/library');
      await expect(page).toHaveURL(/\/pt\/library$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByTestId('library-empty')).toHaveText(new RegExp(EMPTY.pt));
    });
  });

  // The Portuguese slug does not exist. Asserted because it was proposed and declined, and a
  // half-reverted routing change is the same failure class as a half-shipped one: if `/pt/biblioteca`
  // still resolved, it would answer 200 while being neither canonical nor prerendered nor in the sitemap
  // — the #200 defect, reachable by editing the address bar.
  test('does not answer at the declined Portuguese slug', async ({ page }) => {
    await page.goto('/pt/biblioteca');
    await expect(page).toHaveURL(/\/pt$/); // in-locale unknown path → the locale landing
    await expect(page.getByTestId('library-empty')).toHaveCount(0);
  });
});
