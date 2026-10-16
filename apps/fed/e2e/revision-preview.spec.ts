import { test, expect } from '@playwright/test';
import { LOCALES, readRevisions, type Revision } from '../scripts/revision-lines.mjs';

// #741 — a PENDING REVISION of a published article, against the SERVED artifact.
//
// GENERIC, PARAMETERISED OVER `src/content/revisions/`, read from disk at spec load. There is no committed
// fixture, and that is forced rather than chosen: a revision needs a PUBLISHED host, a published fixture
// would sit in the live index, and a held host is refused at module load. So while no correction is
// pending this spec has nothing to run, and it says so — every case reports SKIPPED with the reason,
// never PASSED. The first real run is the revision merge of the first correction.
//
// The same spec runs against the local preview (pre-merge) and against the live apex (post-deploy). The
// served-bytes case runs only on the latter, for the reason `held-draft.spec.ts` gives: `vite preview`
// answers the SPA fallback for every nested path, so locally a snapshot and its absence look the same.
test.use({ locale: 'en-US' });

const revisions = readRevisions();
const NONE = 'no pending revision in src/content/revisions/ — nothing to preview (reported as skipped, never passed)';
const cases: (Revision | undefined)[] = revisions.length > 0 ? revisions : [undefined];
const PENDING = { en: 'Pending revision', pt: 'Revisão pendente' } as const;
// The production origin every snapshot's canonical is written against — a literal, as `library.spec.ts`
// pins it, because the canonical never follows the address the suite happens to run against.
const SITE = 'https://tadeumendonca.io';

for (const rev of cases) {
  test.describe(`pending revision: ${rev?.key ?? '(none)'}`, () => {
    test.beforeEach(() => {
      test.skip(rev === undefined, NONE);
    });

    // Every case needs a line that tells the revision apart from the published text; a revision with
    // no such line is a body that differs only in markup, and this spec cannot witness it.
    test('has a revision-only line in each locale', () => {
      for (const locale of LOCALES) expect(rev!.revisionOnly[locale], `${locale}: revision-only line`).toBeTruthy();
    });

    for (const locale of LOCALES) {
      test(`${locale}: ?preview renders the revision at the real URL`, async ({ page }) => {
        await page.goto(`/${locale}/blog/${rev!.slug[locale]}?preview`);
        // Waits for the revision, not the first paint: a hard load paints the prerendered PUBLISHED
        // snapshot until the bundle runs (createRoot, no hydration).
        await expect(page.locator('body')).toContainText(rev!.revisionOnly[locale]!);
        await expect(page.getByRole('group', { name: locale === 'en' ? 'Article review' : 'Revisão do artigo' }))
          .toContainText(PENDING[locale]);
        if (rev!.publishedOnly[locale]) {
          await expect(page.locator('body')).not.toContainText(rev!.publishedOnly[locale]!);
        }
      });

      test(`${locale}: without the parameter the published text renders`, async ({ page }) => {
        await page.goto(`/${locale}/blog/${rev!.slug[locale]}`);
        await expect(page.locator('article h1')).toBeVisible();
        if (rev!.publishedOnly[locale]) {
          await expect(page.locator('body')).toContainText(rev!.publishedOnly[locale]!);
        }
        await expect(page.locator('body')).not.toContainText(rev!.revisionOnly[locale]!);
        await expect(page.getByRole('group', { name: /Article review|Revisão do artigo/ })).toHaveCount(0);
      });
    }

    // The neutral share address: a human is redirected into their own edition (en-US here) with the
    // query string kept, so the owner can open the link every social post carries and read the revision.
    test('the neutral address with ?preview ends on the revision', async ({ page }) => {
      await page.goto(`/blog/${rev!.slug.en}?preview`);
      await expect(page).toHaveURL(new RegExp(`/en/blog/${rev!.slug.en}\\?preview$`));
      await expect(page.locator('body')).toContainText(rev!.revisionOnly.en!);
    });

    test('the neutral address without the parameter ends on the published text', async ({ page }) => {
      await page.goto(`/blog/${rev!.slug.en}`);
      await expect(page).toHaveURL(new RegExp(`/en/blog/${rev!.slug.en}$`));
      await expect(page.locator('article h1')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(rev!.revisionOnly.en!);
    });

    // The weak half, and the defect it guards against is client-side only: the tag must not ride into
    // the next page the owner navigates to.
    test('noindex is written on the revision and removed on the next route', async ({ page }) => {
      await page.goto(`/en/blog/${rev!.slug.en}?preview`);
      await expect(page.locator('body')).toContainText(rev!.revisionOnly.en!);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      await page.getByRole('link', { name: /All articles/ }).click();
      await expect(page).toHaveURL(/\/en\/?#artigos$|\/en\/?$/);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    });

    // POST-DEPLOY ONLY (AC 16): what the edge actually serves, at every address, with and without the
    // parameter (the query string never selects a different object). The snapshot is the published text.
    test('the served HTML at every address is the published text', async ({ request, baseURL }) => {
      test.skip(
        ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
        'vite preview serves the SPA fallback for every nested path, so it cannot tell a snapshot from one',
      );
      const addresses = [
        ...LOCALES.map((l) => [l, `/${l}/blog/${rev!.slug[l]}`] as const),
        ['en', `/blog/${rev!.slug.en}`] as const,
      ];
      for (const [locale, path] of addresses) {
        for (const url of [path, `${path}?preview`]) {
          const html = await (await request.get(url)).text();
          expect(html, `${url}: the snapshot must not carry the revision`).not.toContain(rev!.revisionOnly[locale]!);
          // The control: this is a real snapshot of THIS address, not the SPA fallback. It is the CANONICAL,
          // never a bare `/blog/<slug>"`: the fallback is the English landing, which LISTS the articles, so
          // it carries that string for the en and neutral addresses and the control passed on the very
          // response it exists to reject. Each snapshot is self-canonical (the neutral one too, ADR-0052);
          // the fallback's canonical is `/en`.
          // (The published text's PRESENCE is not asserted on raw HTML: entity escaping would make a true
          // presence read as absent. It is the build-output grep reported on the PR, AC 15.)
          expect(html, `${url}: must be the article's own snapshot`).toContain(
            `rel="canonical" href="${SITE}${path}"`,
          );
        }
      }
    });
  });
}
