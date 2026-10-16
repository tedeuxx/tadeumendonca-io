import { test, expect } from '@playwright/test';
import { readRevisions } from '../scripts/revision-lines.mjs';

// #688 — `my-commitment` stays as written on 2026-07-26 and opens on a dated update note. The unit block
// in `src/content/my-commitment-note.test.ts` pins the SOURCE; this pins the SERVED bytes, in both locales
// and at the neutral share address (ADR-0052), because that is what a crawler, a JS-less reader and a
// social unfurl receive. A raw request, not `page.goto`, for that reason.
//
// TWO STATES, ONE FILE. The note ships as a PENDING REVISION (#741, ADR-0049 as amended 2026-10-16).
// While `src/content/revisions/` holds a revision for this key (merge 1 landed, merge 2 not), the served
// bytes are the PUBLISHED text, so they must NOT carry the note, and `?preview` must render it. Once no
// revision is pending (merge 2 moved it onto `blog/`), the served bytes carry it, above the original. The
// state is read off the tree at spec load, never typed, so neither branch needs an edit at release and the
// release commit stays a pure move.
test.use({ locale: 'en-US' });

const KEY = 'my-commitment';
const PENDING = readRevisions().some((r) => r.key === KEY);
// The production origin every snapshot's canonical is written against (as `revision-preview.spec.ts`).
const SITE = 'https://tadeumendonca.io';

// Phrases free of apostrophes, which the prerendered HTML may entity-encode.
const EN = {
  note: 'Update, 16 October 2026.',
  close: 'What follows is where I started.',
  original: 'and I decided to do it in the open.',
  pending: 'Pending revision',
  review: 'Article review',
} as const;
const PT = {
  note: 'Atualização, 16 de outubro de 2026.',
  close: 'O que vem abaixo é de onde eu parti.',
  original: 'e decidi fazê-la em público.',
  pending: 'Revisão pendente',
  review: 'Revisão do artigo',
} as const;

const ADDRESSES = [
  ['/en/blog/my-commitment/', EN],
  ['/pt/blog/meu-compromisso/', PT],
  ['/blog/my-commitment/', EN],
] as const;

for (const [path, t] of ADDRESSES) {
  test(`${path} serves ${PENDING ? 'the published text while the revision is pending' : 'the note above the original'}`, async ({
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
    expect(html, `${path}: the original's opening is not in the snapshot`).toContain(t.original);
    if (PENDING) {
      // A visitor without the parameter, and every crawler, still receives the published text.
      expect(html, `${path} serves the pending note to every visitor`).not.toContain(t.note);
      expect(html, `${path} serves the pending note to every visitor`).not.toContain(t.close);
    } else {
      // Once released, the served bytes carry the note, and the original follows it.
      const head = html.indexOf(t.note);
      expect(head, `${path} does not serve the note`).toBeGreaterThan(-1);
      expect(html.indexOf(t.original), `${path}: the original is not after the note`).toBeGreaterThan(head);
    }
  });
}

// On the RENDERED page, never on the prerender over HTTP (ADR-0049 rule 1).
for (const [path, t] of ADDRESSES.slice(0, 2)) {
  test(`${path}?preview renders the pending note`, async ({ page }) => {
    test.skip(!PENDING, 'no pending revision for this key — the note is released; the served-bytes test covers it');
    await page.goto(`${path.replace(/\/$/, '')}?preview`);
    // Waits for the revision, not the first paint (createRoot paints the published snapshot first).
    const article = page.locator('article');
    await expect(article).toContainText(t.note);
    await expect(page.getByRole('group', { name: t.review })).toContainText(t.pending);
    const text = (await article.textContent()) ?? '';
    expect(text.indexOf(t.close), `${path}: the note does not close before the original`).toBeGreaterThan(
      text.indexOf(t.note),
    );
    expect(text.indexOf(t.original), `${path}: the original is not after the note`).toBeGreaterThan(
      text.indexOf(t.close),
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
}
