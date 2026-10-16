import { test, expect } from '@playwright/test';

// #732 — `what-my-agents-do` stays a record of when it was published, carries a content-reviewer
// erratum in its tier drawing, and closes on a dated addendum. The unit block in
// `src/content/what-my-agents-do-addendum.test.ts` pins the SOURCE; this pins the SERVED bytes, in both
// locales and at the neutral share address (ADR-0052), because that is what a crawler, a JS-less reader
// and a social unfurl receive. A raw request, not `page.goto`, for the same reason as
// `architecture-tier-claims.spec.ts`.
//
// The SVG is flattened to its text before matching: mermaid splits a label across `<tspan>`s, so a phrase
// only exists once the tags are gone. Phrases are free of apostrophes the SVG may entity-encode.
const svgText = (html: string): string =>
  (html.match(/<svg[\s\S]*?<\/svg>/g) ?? [])
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

for (const [path, heading, retired, present] of [
  [
    '/en/blog/what-my-agents-do/',
    'Addendum — 15 October 2026',
    'what it blocks is a draft',
    'it blocks nothing: it repairs the draft in place',
  ],
  [
    '/pt/blog/o-que-os-meus-agentes-fazem/',
    'Adendo — 15 de outubro de 2026',
    'o que ele barra é um rascunho',
    'ele não barra nada: conserta o rascunho ali mesmo',
  ],
  [
    '/blog/what-my-agents-do/',
    'Addendum — 15 October 2026',
    'what it blocks is a draft',
    'it blocks nothing: it repairs the draft in place',
  ],
] as const) {
  test(`${path} serves the addendum and the corrected tier drawing`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html, `${path} does not serve the addendum heading`).toContain(heading);
    const text = svgText(html);
    // Anti-vacuity: an empty flatten would satisfy the `not.toContain` below.
    expect(text.length, `${path} carried no inline SVG text`).toBeGreaterThan(1000);
    expect(text, `${path} still publishes the retired content-reviewer clause`).not.toContain(retired);
    expect(text, `${path} does not state the corrected clause`).toContain(present);
  });
}
