import { test, expect } from '@playwright/test';
import { readRevisions } from '../scripts/revision-lines.mjs';

// #732 — `what-my-agents-do` stays a record of when it was published, carries a content-reviewer
// erratum in its tier drawing, and closes on a dated addendum. The unit block in
// `src/content/what-my-agents-do-addendum.test.ts` pins the SOURCE; this pins the SERVED bytes, in both
// locales and at the neutral share address (ADR-0052), because that is what a crawler, a JS-less reader
// and a social unfurl receive. A raw request, not `page.goto`, for the same reason as
// `architecture-tier-claims.spec.ts`.
//
// TWO STATES, ONE FILE (#732 AC 17). The correction ships as a PENDING REVISION (#741, ADR-0049 as amended
// 2026-10-16). While `src/content/revisions/` holds a revision for this key (merge 1 landed, merge 2 not),
// the served bytes are the PUBLISHED text, so they must NOT carry the addendum (AC 15), and `?preview`
// must render the correction (AC 16). Once no revision is pending (merge 2 moved it onto `blog/`), the
// served bytes carry it (AC 8). The state is read off the tree at spec load, never typed, so neither
// branch needs an edit at release and the release commit stays a pure move.
//
// The SVG is flattened to its text before matching: mermaid splits a label across `<tspan>`s, so a phrase
// only exists once the tags are gone. Phrases are free of apostrophes the SVG may entity-encode.
test.use({ locale: 'en-US' });

const KEY = 'what-my-agents-do';
const PENDING = readRevisions().some((r) => r.key === KEY);
// The production origin every snapshot's canonical is written against (as `revision-preview.spec.ts`).
const SITE = 'https://tadeumendonca.io';

const svgText = (html: string): string =>
  (html.match(/<svg[\s\S]*?<\/svg>/g) ?? [])
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

const EN = {
  heading: 'Addendum — 16 October 2026',
  retired: 'what it blocks is a draft',
  present: 'it blocks nothing: it repairs the draft in place',
  identity: 'it was the one that sat on the architecture page when I published this',
  pending: 'Pending revision',
  review: 'Article review',
} as const;
const PT = {
  heading: 'Adendo — 16 de outubro de 2026',
  retired: 'o que ele barra é um rascunho',
  present: 'ele não barra nada: conserta o rascunho ali mesmo',
  identity: 'era o que estava na página de arquitetura quando eu publiquei este texto',
  pending: 'Revisão pendente',
  review: 'Revisão do artigo',
} as const;

const ADDRESSES = [
  ['/en/blog/what-my-agents-do/', EN],
  ['/pt/blog/o-que-os-meus-agentes-fazem/', PT],
  ['/blog/what-my-agents-do/', EN],
] as const;

for (const [path, t] of ADDRESSES) {
  if (PENDING) {
    // AC 15: a visitor without the parameter, and every crawler, still receives the published text.
    test(`${path} serves the published text while the revision is pending`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      // The control: this is the article's own snapshot (self-canonical, ADR-0052), not the SPA fallback,
      // whose canonical is `/en` — an absence asserted on the fallback would pass by construction.
      expect(html, `${path}: must be the article's own snapshot`).toContain(
        `rel="canonical" href="${SITE}${path.replace(/\/$/, '')}"`,
      );
      expect(html, `${path} serves the pending addendum to every visitor`).not.toContain(t.heading);
      const text = svgText(html);
      // Anti-vacuity: an empty flatten would satisfy nothing below; the published drawing must be served.
      expect(text.length, `${path} carried no inline SVG text`).toBeGreaterThan(1000);
      expect(text, `${path} no longer serves the published drawing`).toContain(t.retired);
    });
  } else {
    // AC 8: once released, the served bytes carry the correction.
    test(`${path} serves the addendum and the corrected tier drawing`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html, `${path} does not serve the addendum heading`).toContain(t.heading);
      const text = svgText(html);
      // Anti-vacuity: an empty flatten would satisfy the `not.toContain` below.
      expect(text.length, `${path} carried no inline SVG text`).toBeGreaterThan(1000);
      expect(text, `${path} still publishes the retired content-reviewer clause`).not.toContain(t.retired);
      expect(text, `${path} does not state the corrected clause`).toContain(t.present);
    });
  }
}

// AC 16: on the RENDERED page, never on the prerender over HTTP (ADR-0049 rule 1).
for (const [path, t] of ADDRESSES.slice(0, 2)) {
  test(`${path}?preview renders the pending correction`, async ({ page }) => {
    test.skip(!PENDING, 'no pending revision for this key — the correction is released; AC 8 covers it');
    await page.goto(`${path.replace(/\/$/, '')}?preview`);
    // Waits for the revision, not the first paint (createRoot paints the published snapshot first).
    await expect(page.locator('article')).toContainText(t.heading);
    await expect(page.getByRole('group', { name: t.review })).toContainText(t.pending);
    await expect(page.locator('article')).toContainText(t.identity);
    const desc = (await page.locator('article svg desc').allTextContents()).join(' ').replace(/\s+/g, ' ');
    expect(desc, `${path}: the tier drawing's description is not the revised one`).toContain(t.present);
    expect(desc).not.toContain(t.retired);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
}
