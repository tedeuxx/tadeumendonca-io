import { test, expect } from '@playwright/test';

// #716 — what the agent-tier diagram on /architecture tells a reader about who applies `ready` on a
// `loop` Issue, what holds the orchestrator's merge, and what `content-reviewer` does. The unit block in
// `scripts/architecture-diagrams.test.mjs` pins the SOURCE; this pins the SERVED bytes, because the
// diagram is compiled to inline SVG at build time (ADR-0040) and the generated artifact is a second
// copy that can lag the source. A raw request, not `page.goto`: the claim is about what a crawler and a
// JS-less reader receive, and the running app would render the same SVG whether or not it was
// prerendered.
//
// The SVG is flattened to its text before matching: mermaid splits a label into one `<tspan>` per line
// (and sometimes per word), so a phrase that spans tspans only exists once the tags are gone. Phrases
// are chosen free of apostrophes and other characters the SVG may entity-encode.
const flatten = (html: string): string =>
  (html.match(/<svg[\s\S]*?<\/svg>/g) ?? [])
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

for (const [path, retired, present] of [
  [
    '/en/architecture/',
    ['mine alone to apply', 'a hook refuses it the merge', 'what it blocks is a draft', 'commits, pushes', 'the gate merges none of them:'],
    [
      'applied by the main session',
      'no hook refuses it, a rule holds it',
      'it blocks nothing: it repairs the draft in place',
      'the gate merges none of them before my go',
      'the gate reads that comment itself',
    ],
  ],
  [
    '/pt/architecture/',
    ['só eu ponho', 'um hook recusa a ele', 'o que ele barra é um rascunho', 'commita, empurra', 'o gate não faz merge de nenhum deles:'],
    [
      'posta pela sessão principal',
      'nenhum hook recusa, uma regra segura',
      'ele não barra nada: conserta o rascunho ali mesmo',
      'o gate não faz merge de nenhum deles antes do meu go',
      'o gate lê esse comentário ele mesmo',
    ],
  ],
] as const) {
  test(`the tier diagram served at ${path} states the current loop, not the retired one`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const text = flatten(await response.text());
    // Anti-vacuity: an empty flatten would satisfy every `not.toContain` below.
    expect(text.length, `${path} carried no inline SVG text`).toBeGreaterThan(1000);
    for (const phrase of retired) expect(text, `${path} still publishes: ${phrase}`).not.toContain(phrase);
    for (const phrase of present) expect(text, `${path} does not state: ${phrase}`).toContain(phrase);
  });
}
