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
// (apps/fed/src/content/ → four levels up to the repo root), e.g. '../../../../docs/adr/0053-….md'.
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
  // #374. `iac/.checkov.yaml` is cited by the security subsection because the scanner's DEVIATION —
  // written in the file, with its reason — is the auditable half of "no CMK, SSM String only". It is a
  // DOTFILE, so it needs its own literal entry: the `iac/**/*` patterns above do not match a leading
  // dot, and a `*.yaml` glob would have looked right and resolved nothing. Measured, not assumed — the
  // suite went red on exactly this link before the line was added.
  ...import.meta.glob('../../../../iac/.checkov.yaml', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../iac/cloudfront-functions/*.js', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../apps/fed/scripts/*.mjs', { eager: true, query: '?raw' }),
  ...import.meta.glob('../../../../.github/workflows/*.yml', { eager: true, query: '?raw' }),
  ...import.meta.glob('./generated/*.json', { eager: true, query: '?raw' }),
};
const existingDocPaths = new Set(Object.keys(repoModules).map(toRepoPath));
const contentByPath = new Map(
  Object.entries(repoModules).map(([key, mod]) => [toRepoPath(key), (mod as { default: string }).default]),
);

// A link can carry a `#fragment` since the tenth fold slice of #456: the page's reversed-decision links
// stopped naming a file of their own and point at the `## What this replaced` section of the record that
// absorbed them. A fragment is a second claim beside the file — "this heading exists there" — and a
// renamed heading breaks it as silently as a renamed file breaks the path, so it is checked, not stripped.
const splitTarget = (target: string): { path: string; fragment: string | null } => {
  const i = target.indexOf('#');
  return i < 0 ? { path: target, fragment: null } : { path: target.slice(0, i), fragment: target.slice(i + 1) };
};

// GitHub's heading anchor: lower-cased, every character that is not a letter, digit, mark, space,
// hyphen or underscore dropped, then each space turned into a hyphen — one for one, which is why an em
// dash between two spaces becomes `--`. A repeated heading takes `-1`, `-2`, … in document order.
// Headings inside a fenced block are code, not headings, and are skipped.
const headingAnchors = (markdown: string): Set<string> => {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  let fence: string | null = null;
  for (const line of markdown.split('\n')) {
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (open) {
      if (fence === null) fence = open[1][0];
      else if (open[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const base = heading[1]
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  return anchors;
};

// Pull every in-repo file link out of a markdown body: a GitHub blob URL for THIS repo, on the main
// branch, capturing the repo-relative path it points at. `[^)\s]+` stops at the first `)` or whitespace so
// a link inside `(→ [ADR-…](url) …)` doesn't swallow the trailing prose.
const BLOB_URL = /https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/blob\/main\/([^)\s]+)/g;

const localTargetsIn = (markdown: string): string[] =>
  [...markdown.matchAll(BLOB_URL)].map((m) => m[1]);

describe('architecture page — outbound file links resolve in the repo (#153)', () => {
  // The glob itself must have found the docs tree — otherwise every assertion below passes vacuously.
  it('sees the real docs/ and iac/ trees', () => {
    expect(existingDocPaths.has('docs/adr/0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md')).toBe(true);
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
  // never had. Long-form is one file per locale (ADR-0036, *The locale layer*), so the two CAN drift — and they drift most
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

    const missing = targets.filter((target) => !existingDocPaths.has(splitTarget(target).path));
    expect(missing).toEqual([]);
  });

  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ] as const)('every #fragment in the %s edition names a heading in its target', (_locale, body) => {
    const withFragment = localTargetsIn(body)
      .map(splitTarget)
      .filter((t): t is { path: string; fragment: string } => t.fragment !== null);

    // The reversed-decision links are the reason this exists; without at least one fragment on the page
    // the assertion below would hold vacuously.
    expect(withFragment.length).toBeGreaterThan(0);

    const unresolved = withFragment
      .filter(({ path, fragment }) => {
        const text = contentByPath.get(path);
        return text === undefined || !path.endsWith('.md') || !headingAnchors(text).has(fragment);
      })
      .map(({ path, fragment }) => `${path}#${fragment}`);
    expect(unresolved).toEqual([]);
  });
});

describe('headingAnchors', () => {
  it('slugs a heading the way GitHub does, including a repeat and an em dash', () => {
    const md = [
      '## What this replaced',
      '### What this replaced: the edge OG renderer and the link unfurl',
      '## Lean by design — the keystone',
      '## What this replaced',
      '```',
      '## not a heading',
      '```',
    ].join('\n');
    expect([...headingAnchors(md)]).toEqual([
      'what-this-replaced',
      'what-this-replaced-the-edge-og-renderer-and-the-link-unfurl',
      'lean-by-design--the-keystone',
      'what-this-replaced-1',
    ]);
  });
});
