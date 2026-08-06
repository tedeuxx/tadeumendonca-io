import { test, expect } from '@playwright/test';

// The Biblioteca / Library surface (#166) — the route in both editions, now with books on the shelf.
//
// WHY EVERY ASSERTION HERE ANCHORS ON CONTENT ONLY THIS PAGE CAN PRODUCE, RATHER THAN ON A 200, and this
// is the whole reason the file is written the way it is: `vite preview` falls a missing path through to
// `index.html`, and CloudFront maps 404 → /index.html with response code 200 (iac/frontend.tf). So a route
// that does not exist, a route whose data import broke, and a route that renders correctly all answer 200
// with HTML. The only thing that separates them is a string only this page can produce.
//
// WHAT CHANGED WITH THE FIRST BOOKS. Slice 1 anchored on the EMPTY-STATE sentence, which was then the
// page's whole payload. It no longer is, and — the part worth stating — anchoring on it now would be
// actively wrong: a broken data import renders exactly that sentence, so a suite still pinned to it would
// go GREEN on the failure it exists to catch. The anchor moves to a book. The empty state did not become
// dead code; it moved to `LibraryPage.test.tsx`, which renders it through the page's `entries` seam,
// because with a populated shelf no HTTP journey can reach that branch at all.
//
// The nav DOES carry a Library entry now (#166's second slice), so the "reaches it from the nav" journey
// that slice 1 deliberately omitted is here.

const SITE = 'https://tadeumendonca.io';

// One shipped book, pinned per edition — the title (a locale-free fact) plus a fragment of the takeaway
// (per-locale prose). Pinned as literals rather than imported from `src/data/library.ts`: this suite runs
// against a BUILT artifact, and importing the source would assert that the page renders whatever the
// source says, which is true of a stale build too.
const BOOK = {
  title: 'AI Engineering',
  url: 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/',
  takeaway: {
    pt: 'uma visão panorâmica dos fundamentos',
    en: 'a panoramic view of the fundamentals',
  },
};
// The second entry, so the shelf is proven to render the LIST and not just its first row.
const SECOND_BOOK_TITLE = 'Building Applications with AI Agents';
// The empty-state sentence. Asserted ABSENT on the served page: it is the string a broken data import
// produces, so its absence is what makes "the shelf rendered" mean the shelf rendered.
const EMPTY = {
  pt: 'Esta estante ainda está sendo montada.',
  en: 'This shelf is still being put together.',
};

test.describe('/library serves the shelf, in both editions', () => {
  for (const [locale, heading, other] of [
    ['pt', /Biblioteca/, 'en'],
    ['en', /Library/, 'pt'],
  ] as const) {
    test(`/${locale}/library renders the ${locale} shelf with its books`, async ({ page }) => {
      await page.goto(`/${locale}/library`);
      // The URL stands — no redirect away, which is what would happen if the route did not exist.
      await expect(page).toHaveURL(new RegExp(`/${locale}/library$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      // THE ASSERTIONS THAT DISTINGUISH THIS FROM A FALLTHROUGH 200 — and from a shelf that lost its data.
      const shelf = page.getByTestId('library-shelf');
      await expect(shelf.getByRole('listitem')).toHaveCount(2);
      await expect(shelf.getByRole('link', { name: new RegExp(BOOK.title) })).toHaveAttribute('href', BOOK.url);
      await expect(shelf).toContainText(SECOND_BOOK_TITLE);
      await expect(shelf).toContainText(BOOK.takeaway[locale]);
      // Every book carries its rating, announced rather than only drawn.
      await expect(shelf.getByRole('img')).toHaveCount(2);

      // The empty state must be gone. If the data import broke, THIS is what the page would show, and
      // every assertion above would already have failed — this one names the failure instead of leaving
      // the reader of a red run to infer it.
      await expect(page.getByTestId('library-empty')).toHaveCount(0);
      // And the parity rule: the other edition's takeaway must be ABSENT, not merely outnumbered. A build
      // that rendered both, or the wrong locale, passes a presence-only check.
      await expect(page.getByText(BOOK.takeaway[other])).toHaveCount(0);
      await expect(page.getByText(EMPTY[other])).toHaveCount(0);
    });
  }

  // A JS-LESS CRAWLER GETS IT. `page.goto` runs the app and would pass whether or not the route was ever
  // prerendered — the trap #170 recorded for the diagrams and #200 for hreflang. This inspects the raw
  // HTTP body, so it proves the per-locale FILE was written by the prerender rather than the SPA shell
  // falling through: the shell is the English landing, so its bytes carry none of these strings.
  for (const [locale, otherLocale] of [
    ['pt', 'en'],
    ['en', 'pt'],
  ] as const) {
    test(`the ${locale} edition's books are in the prerendered bytes, not only after hydration`, async ({
      request,
    }) => {
      const html = await (await request.get(`/${locale}/library/`)).text();
      expect(html, 'the book must be in the served HTML').toContain(BOOK.title);
      expect(html, 'and its takeaway, in this edition’s language').toContain(BOOK.takeaway[locale]);
      expect(html, 'the whole shelf, not only its first row').toContain(SECOND_BOOK_TITLE);
      expect(html, 'the other edition’s prose must not be served here').not.toContain(BOOK.takeaway[otherLocale]);
      expect(html, 'a populated shelf must not also serve the empty state').not.toContain(EMPTY[locale]);
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
  // The nav entry, which arrived with the books rather than with the route (#166). Both editions, because
  // the nav href is built by `useLocalePath` and a prefix bug shows up in exactly one of them.
  for (const [locale, label, heading] of [
    ['pt', 'Biblioteca', /Biblioteca/],
    ['en', 'Library', /Library/],
  ] as const) {
    test(`a ${locale} reader reaches the shelf from the nav`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/library$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByTestId('library-shelf')).toContainText(BOOK.title);
    });
  }

  // The cross-link from /ramp-up, deferred to the slice that lands the first entries. It is authored in
  // markdown as the LOGICAL path `/library` in both editions and resolved to the active locale — so this
  // is also the journey that proves a pt reader is not handed the English shelf.
  test('a pt reader follows the ramp-up cross-link into the Portuguese shelf', async ({ page }) => {
    await page.goto('/pt/ramp-up');
    await page.getByRole('link', { name: 'Biblioteca', exact: true }).last().click();
    await expect(page).toHaveURL(/\/pt\/library$/);
    await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.pt);
  });

  test('an en reader follows the ramp-up cross-link into the English shelf', async ({ page }) => {
    await page.goto('/en/ramp-up');
    await page.getByRole('link', { name: 'Library', exact: true }).last().click();
    await expect(page).toHaveURL(/\/en\/library$/);
    await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.en);
  });

  // The PT/EN toggle. It stays ON the surface rather than dropping the reader on the landing — which is
  // what a route the toggle cannot map does, silently, via the in-locale `*`.
  test('the toggle carries the reader across editions without leaving the page', async ({ page }) => {
    await page.goto('/pt/library');
    await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/library$/);
    await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.en);

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'PT' }).click();
    await expect(page).toHaveURL(/\/pt\/library$/);
    await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.pt);
  });

  // The unprefixed path — the shape an old bookmark or a hand-typed URL takes. It is NOT prerendered and
  // must never be advertised, but it must resolve, in the reader's own edition (ADR-0036).
  test.describe('a pt-BR reader', () => {
    test.use({ locale: 'pt-BR' });
    test('reaches the Portuguese edition from the unprefixed path', async ({ page }) => {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/pt\/library$/);
      await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.pt);
    });
  });

  test.describe('an en-US reader', () => {
    test.use({ locale: 'en-US' });
    test('reaches the English edition from the unprefixed path', async ({ page }) => {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/en\/library$/);
      await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.en);
    });

    // The path beats the browser (ADR-0036), on this surface too. An en-US browser opening a shared
    // `/pt/library` link keeps Portuguese — which is the property the owner's requirement named, and the
    // reason the localized slug pair was not needed to deliver it.
    test('still gets Portuguese from a shared /pt/library link', async ({ page }) => {
      await page.goto('/pt/library');
      await expect(page).toHaveURL(/\/pt\/library$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByTestId('library-shelf')).toContainText(BOOK.takeaway.pt);
    });
  });

  // The Portuguese slug does not exist. Asserted because it was proposed and declined, and a
  // half-reverted routing change is the same failure class as a half-shipped one: if `/pt/biblioteca`
  // still resolved, it would answer 200 while being neither canonical nor prerendered nor in the sitemap
  // — the #200 defect, reachable by editing the address bar.
  test('does not answer at the declined Portuguese slug', async ({ page }) => {
    await page.goto('/pt/biblioteca');
    await expect(page).toHaveURL(/\/pt$/); // in-locale unknown path → the locale landing
    await expect(page.getByTestId('library-shelf')).toHaveCount(0);
  });
});
