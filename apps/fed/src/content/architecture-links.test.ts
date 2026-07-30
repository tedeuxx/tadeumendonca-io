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

// The real repo trees this page links into, enumerated at build time. Keys are relative to THIS file
// (apps/fed/src/content/ → four levels up to the repo root), e.g. '../../../../docs/adr/0001-….md'.
//
// `docs/` was the only tree until the cost section linked `iac/budget.tf` (#171). That link made the
// guard go RED rather than skip — which is the behaviour to keep: an in-repo URL this test cannot
// resolve is exactly the link-rot it exists to catch, so the fix is to teach it the tree, never to
// narrow the regex to the trees it already knows.
const REPO_PREFIX = '../../../../';
const repoModules = {
  ...import.meta.glob('../../../../docs/**/*.md', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../iac/**/*.tf', { eager: true, query: '?raw' }),
};
const existingDocPaths = new Set(
  Object.keys(repoModules).map((key) => key.slice(REPO_PREFIX.length)),
);

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
