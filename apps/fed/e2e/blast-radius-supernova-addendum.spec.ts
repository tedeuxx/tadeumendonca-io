import { test, expect } from '@playwright/test';
import { readRevisions } from '../scripts/revision-lines.mjs';

// #737 — `blast-radius-supernova` stays a record of when it was published (2026-08-28) and closes on a
// dated addendum, with the sign-off moved to its end. The unit block in
// `src/content/blast-radius-supernova-addendum.test.ts` pins the SOURCE; this pins the SERVED bytes, in
// both locales and at the neutral share address (ADR-0052), because that is what a crawler, a JS-less
// reader and a social unfurl receive. A raw request, not `page.goto`, for that reason.
//
// TWO STATES, ONE FILE (#737 AC 16). The addendum ships as a PENDING REVISION (#741, ADR-0049 as amended
// 2026-10-16). While `src/content/revisions/` holds a revision for this key (merge 1 landed, merge 2 not),
// the served bytes are the PUBLISHED text, so they must NOT carry the addendum (AC 14), and `?preview`
// must render it (AC 15). Once no revision is pending (merge 2 moved it onto `blog/`), the served bytes
// carry it, with the sign-off after it (AC 7). The state is read off the tree at spec load, never typed,
// so neither branch needs an edit at release and the release commit stays a pure move.
test.use({ locale: 'en-US' });

const KEY = 'blast-radius-supernova';
const PENDING = readRevisions().some((r) => r.key === KEY);
// The production origin every snapshot's canonical is written against (as `revision-preview.spec.ts`).
const SITE = 'https://tadeumendonca.io';

const EN = {
  heading: 'Addendum — 16 October 2026',
  signOff: 'Good luck out there, and may your radius be narrow.',
  pending: 'Pending revision',
  review: 'Article review',
} as const;
const PT = {
  heading: 'Adendo — 16 de outubro de 2026',
  signOff: 'Boa sorte por aí, e que o seu raio seja estreito.',
  pending: 'Revisão pendente',
  review: 'Revisão do artigo',
} as const;

// The slug is the same string in both editions of this article.
const ADDRESSES = [
  ['/en/blog/blast-radius-supernova/', EN],
  ['/pt/blog/blast-radius-supernova/', PT],
  ['/blog/blast-radius-supernova/', EN],
] as const;

for (const [path, t] of ADDRESSES) {
  test(`${path} serves ${PENDING ? 'the published text while the revision is pending' : 'the addendum, with the sign-off after it'}`, async ({
    request,
  }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    // The control: this is the article's own snapshot (self-canonical, ADR-0052), not the SPA fallback,
    // whose canonical is `/en` — an absence asserted on the fallback would pass by construction.
    expect(html, `${path}: must be the article's own snapshot`).toContain(
      `rel="canonical" href="${SITE}${path.replace(/\/$/, '')}"`,
    );
    // Anti-vacuity: the snapshot carries the article body, whichever state it is in.
    expect(html, `${path}: the article's sign-off is not in the snapshot`).toContain(t.signOff);
    if (PENDING) {
      // AC 14: a visitor without the parameter, and every crawler, still receives the published text.
      expect(html, `${path} serves the pending addendum to every visitor`).not.toContain(t.heading);
    } else {
      // AC 7: once released, the served bytes carry the addendum and the sign-off closes it.
      const head = html.indexOf(t.heading);
      expect(head, `${path} does not serve the addendum heading`).toBeGreaterThan(-1);
      expect(html.indexOf(t.signOff), `${path}: the sign-off is not after the addendum`).toBeGreaterThan(head);
    }
  });
}

// AC 15: on the RENDERED page, never on the prerender over HTTP (ADR-0049 rule 1).
for (const [path, t] of ADDRESSES.slice(0, 2)) {
  test(`${path}?preview renders the pending addendum`, async ({ page }) => {
    test.skip(!PENDING, 'no pending revision for this key — the addendum is released; AC 7 covers it');
    await page.goto(`${path.replace(/\/$/, '')}?preview`);
    // Waits for the revision, not the first paint (createRoot paints the published snapshot first).
    const article = page.locator('article');
    await expect(article).toContainText(t.heading);
    await expect(page.getByRole('group', { name: t.review })).toContainText(t.pending);
    const text = (await article.textContent()) ?? '';
    expect(text.indexOf(t.signOff), `${path}: the sign-off is not after the addendum`).toBeGreaterThan(
      text.indexOf(t.heading),
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
}
