// Link-rot guard for the /architecture page (#153).
//
// The page is an ORIENTATION layer: instead of restating the architecture, it LINKS each load-bearing
// decision to its canonical ADR file by a hard-coded GitHub blob URL (plus the ADR index and the
// catalog-ready gate). That drift-safe design has one soft spot — nothing mechanically ties those URLs to
// the actual `docs/` filenames. Rename an ADR (the practice renames-on-supersede, rare but real) and the
// link silently 404s; only a human clicking it would ever notice, on the very page whose thesis is rigor.
//
// This asserts, OFFLINE, that every `tadeumendonca-io` blob URL cited in either edition points at a file
// that exists in the repo. It resolves against the real `docs/` tree via Vite's import.meta.glob (the same
// module world the app builds in — no network, no node fs), so it is fast, deterministic, and catches the
// rename at PR time instead of at reader time. Cross-repo URLs (the tadeumendonca-skills repo, and the bare
// repo roots that carry no `/blob/main/<path>`) are not local files and are intentionally skipped.
import { describe, it, expect } from 'vitest';
import architectureEn from './architecture.en.md?raw';
import architecturePt from './architecture.pt.md?raw';
import { repoCardFor } from '../data/repoCards';

// The real repo trees this page links into, enumerated at build time. Keys are relative to THIS file
// (apps/fed/src/content/ → four levels up to the repo root), e.g. '../../../../docs/adr/0001-….md'.
//
// `docs/` was the only tree until the cost section linked `iac/budget.tf` (#171). That link made the
// guard go RED rather than skip — which is the behaviour to keep: an in-repo URL this test cannot
// resolve is exactly the link-rot it exists to catch, so the fix is to teach it the tree, never to
// narrow the regex to the trees it already knows.
// #170 added three more trees for the same reason and with the same fix: the request-path section links
// the edge function, its unit test and the workflow that asserts the deployed function still matches the
// repo. Those are exactly the claims a reader would want to check, so they are linked rather than
// asserted — and every one of them is a path that can be renamed.
//
// Keys are NOT uniform, and assuming they were cost a round: Vite normalises a glob to the shortest
// relative path, so `../../../../apps/fed/scripts/*.mjs` comes back as `../../scripts/*.mjs` — inside
// the same package it never walks up to the repo root and back down. A single four-level slice
// therefore silently produced a key nothing could match, and the failure looked like a broken LINK
// rather than a broken glob. Resolved explicitly, per depth.
// A THIRD key shape, and it arrives for the same reason as the second: the page now links a generated
// artifact that sits next to THIS file, so Vite normalises the glob all the way down to `./generated/…`.
// Same fix as before — teach the resolver the depth, never narrow the regex that finds the link.
const REPO_PREFIX = '../../../../';
const FED_PREFIX = '../../';
const CONTENT_PREFIX = './';
const toRepoPath = (key: string): string => {
  if (key.startsWith(REPO_PREFIX)) return key.slice(REPO_PREFIX.length);
  if (key.startsWith(FED_PREFIX)) return `apps/fed/${key.slice(FED_PREFIX.length)}`;
  return `apps/fed/src/content/${key.slice(CONTENT_PREFIX.length)}`;
};
const repoModules = {
  ...import.meta.glob('../../../../docs/**/*.md', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../iac/**/*.tf', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../iac/cloudfront-functions/*.js', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../apps/fed/scripts/*.mjs', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../.github/workflows/*.yml', { eager: true, query: '?raw' }),
  ...import.meta.glob('./generated/*.json', { eager: true, query: '?raw' }),
};
const existingDocPaths = new Set(Object.keys(repoModules).map(toRepoPath));

// Pull every in-repo file link out of a markdown body: a GitHub blob URL for THIS repo, on the main
// branch, capturing the repo-relative path it points at. `[^)\s]+` stops at the first `)` or whitespace so
// a link inside `(→ [ADR-…](url) …)` doesn't swallow the trailing prose.
const BLOB_URL = /https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/blob\/main\/([^)\s]+)/g;

const localTargetsIn = (markdown: string): string[] =>
  [...markdown.matchAll(BLOB_URL)].map((m) => m[1]);

describe('architecture page — outbound file links resolve in the repo (#153)', () => {
  // The glob itself must have found the docs tree — otherwise every assertion below passes vacuously.
  it('sees the real docs/ and iac/ trees', () => {
    expect(existingDocPaths.has('docs/adr/0001-lean-by-design-calibrated-to-strategy.md')).toBe(true);
    expect(existingDocPaths.has('docs/adr/README.md')).toBe(true);
    expect(existingDocPaths.has('iac/budget.tf')).toBe(true);
    // One per tree added in #170 — a glob that silently matched nothing would make every link into it
    // fail, and the temptation then is to blame the link rather than the glob.
    expect(existingDocPaths.has('iac/cloudfront-functions/spa-rewrite.js')).toBe(true);
    expect(existingDocPaths.has('apps/fed/scripts/spa-rewrite.test.mjs')).toBe(true);
    // A workflow file, as the canary for the .github/ tree. It named infra-apply.yml until the
    // pipeline was rebuilt into four workflows — and this line going red is how that rename was
    // caught reaching the reader: the architecture page linked to the same file, in both locales.
    expect(existingDocPaths.has('.github/workflows/deploy.yml')).toBe(true);
    // The generated tree, added when the harness section started citing the manifest itself rather than
    // the script that writes it. Its key shape is the third one `toRepoPath` has to know about.
    expect(existingDocPaths.has('apps/fed/src/content/generated/harness.json')).toBe(true);
  });

  // Cross-locale parity, the rule `content.test.ts` already applies to an article body and this page has
  // never had. Long-form is one file per locale (ADR-0032), so the two CAN drift — and they drift most
  // easily when a slice adds a section to one edition and translates it into the other by hand, which is
  // every slice this page has ever had. Same targets, same order: a link added to `en` and forgotten in
  // `pt` is a pt reader who cannot reach the evidence the en reader is offered.
  it('cites the same in-repo files, in the same order, in both editions', () => {
    expect(localTargetsIn(architecturePt)).toEqual(localTargetsIn(architectureEn));
    expect(localTargetsIn(architectureEn).length).toBeGreaterThan(0);
  });

  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ] as const)('every docs/ link in the %s edition points at a file that exists', (_locale, body) => {
    const targets = localTargetsIn(body);

    // Guard against a regex that silently matched nothing (an empty page would otherwise pass vacuously).
    expect(targets.length).toBeGreaterThan(0);

    const missing = targets.filter((path) => !existingDocPaths.has(path));
    expect(missing).toEqual([]);
  });
});

// The page's CLOSING ELEMENT — asserted here for the EN edition, which no layer covered (#318).
//
// The setup walkthrough moved to the READMEs, so what the page owes a reader at that point is a way INTO
// the two repos rather than a second copy of what they say. That is delivered WITHOUT a component in the
// markdown: `Markdown.tsx`'s `p` handler turns a paragraph holding a LONE repo URL into a `<RepoCard>`,
// opt-in by URL through the `repoCards.ts` registry — the same shape as the YouTube facade.
//
// THE DELIVERY IS THEREFORE INVISIBLE IN THE SOURCE. The markdown reads as two links; the page renders
// two accent-marked cards. A review that reads the markdown concludes the section was never built — one
// did, this session, and recommended building a second mechanism for it.
//
// WHAT THIS DOES *NOT* CLAIM, because the first version of this comment claimed it and it was false:
// it is NOT true that deleting a registry row goes unnoticed. `e2e/routes.spec.ts` has asserted the
// rendered cards since #318 — two of them, by testid, with both hrefs in order and the decorative mark.
// That journey is the stronger object and it stays the primary guard. **It drives `/pt/architecture`
// only.** The EN edition was covered by nothing, in any layer, and that gap is what this closes.
//
// Asserted against the registry rather than by rendering: the E2E already owns the DOM, and duplicating
// it here would be a weaker copy of a stronger check. What this owns is the cheap, per-edition,
// PR-time half — the failure mode `URL on the page ∉ registry`, named directly.
describe('architecture page — the closing repo cards are still cards (#318)', () => {
  // MODELLED ON `loneUrl` + `repoCardFor`, deliberately, and the first version of this was not — it was
  // a line-oriented regex that captured out of the LABEL position while the renderer is paragraph-
  // oriented and keys on the HREF. Four mutations of the real markdown broke the page and left it green:
  // a `tree/` subpath, a `#fragment`, a link whose label says `-io` while its href says `-skills`, and
  // merging both URLs into ONE paragraph (which renders zero cards). The last one is why the old
  // "vacuous-pass guard" was not one: a paragraph merge IS a reformat, and the match never went empty.
  //
  // The model that matters, from `loneUrl`: a paragraph counts only if its ENTIRE content is one link,
  // and an explicit `[label](href)` yields a card only when `label === href`. A mismatched pair renders
  // as an ordinary anchor, so a check reading the label is measuring the wrong string.
  const PARAGRAPH_LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;
  const PARAGRAPH_BARE = /^(https?:\/\/[^\s)]+)$/;

  /** Hrefs that would reach `repoCardFor` — one per paragraph that is nothing but a self-labelled link. */
  const cardableHrefs = (body: string) =>
    body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .flatMap((p) => {
        const explicit = PARAGRAPH_LINK.exec(p);
        if (explicit) return explicit[1] === explicit[2] ? [explicit[2]] : [];
        const bare = PARAGRAPH_BARE.exec(p);
        return bare ? [bare[1]] : [];
      })
      .filter((href) => repoCardFor(href));

  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ] as const)('renders both repos as cards in the %s edition', (_locale, body) => {
    // Exact list rather than a count, and IN ORDER — the same two repos in the same sequence the E2E
    // pins on the served page, so the two layers cannot disagree about what the section says.
    expect(cardableHrefs(body).map((u) => u.toLowerCase())).toEqual([
      'https://github.com/tedeuxx/tadeumendonca-io',
      'https://github.com/tedeuxx/tadeumendonca-skills',
    ]);
  });

  // THE MATCHER'S OWN REGRESSION SET, and it exists because the assertion above is only as good as the
  // model behind it. The previous model passed the page and failed four mutations of it — proving the
  // page green says nothing about whether the check can go red. These pin the model against synthetic
  // input so the property survives without anyone remembering to mutate the real markdown by hand.
  //
  // Each `false` case is a shape that renders NO card. If one of them ever counts as cardable, the
  // assertion above starts passing on a page whose closing element has silently become plain links.
  const IO = 'https://github.com/tedeuxx/tadeumendonca-io';
  it.each([
    ['a self-labelled link alone in its paragraph', `[${IO}](${IO})`, true],
    ['a bare URL alone in its paragraph', IO, true],
    // The four that the line-oriented model let through.
    ['both URLs merged into one paragraph', `[${IO}](${IO})\n[${IO}](${IO})`, false],
    ['a label that disagrees with its href', `[${IO}](${IO}-skills)`, false],
    ['a deeper tree/ path', `[${IO}/tree/main](${IO}/tree/main)`, false],
    ['a #fragment form', `[${IO}#readme](${IO}#readme)`, false],
    // Shapes the old model already handled — kept so a rewrite cannot lose them.
    ['a URL inside a sentence', `See ${IO} for the code.`, false],
    ['a list item', `- [${IO}](${IO})`, false],
    ['a human-worded label', `[the site repo](${IO})`, false],
  ])('%s → cardable: %s', (_name, paragraph, expected) => {
    expect(cardableHrefs(paragraph).length > 0).toBe(expected);
  });
});
