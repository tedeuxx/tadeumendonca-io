// The single source of truth for the site's public routes at build time. Both the prerender
// (scripts/prerender.mjs) and the sitemap generator (scripts/gen-sitemap.mjs) import from here, so the
// snapshotted HTML and the advertised sitemap URLs can NEVER drift apart — a route enumerated once is
// prerendered and listed together, or neither. Slug derivation must match src/lib/content.ts.
import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content', 'blog');

// Per-locale URLs (ADR-0036): every route is first-class under both prefixes.
export const LOCALES = ['pt', 'en'];

// The static (non-article) UNPREFIXED logical routes, in a stable order. This list is the build-time
// source of truth: compare it against the `<Route>` set in src/App.tsx, which is the only other place
// a route exists.
//
// Real routes only. Everything else `App.tsx` declares is a non-destination and is excluded: `/blog`
// → the landing's #artigos, the in-locale `*` → the locale landing, and the outer `*` → `RootRedirect`,
// which sends an unprefixed path to the reader's edition. Four `<Route>`s that redirect, none of them a
// place to snapshot or advertise.
//
// (Until #262 this comment named /articles, /cv and /profile instead. Those were dropped pre-launch in
// #234 and the comment outlived them, which made archaeology read as load-bearing exclusion — someone
// asking why /cv is excluded would go looking for a /cv to exclude.)
const STATIC_ROUTES = ['/', '/me', '/portfolio', '/ramp-up', '/architecture'];

// Read every blog article's PER-LOCALE frontmatter slug, grouped by filename KEY — must match
// src/lib/content.ts (the filename base is the grouping key, slug is per-locale frontmatter, ADR-0037).
// Files are `<key>.<locale>.md`; a missing frontmatter slug falls back to the key. Returns one
// `{ pt, en }` slug pair per article.
// Memoised (#184). BEFORE the memo, `blogEditions` was called from `localizedRoutes`, from
// `slugPairIndex`, and again on every `alternatesFor` invocation — and `gen-sitemap` calls that once per
// route, so the directory was re-read and re-parsed once per URL. Now the read and the YAML parse happen
// once per process. The slug→pair index is memoised separately (below): caching only this one left the
// index still rebuilding per call, so the per-URL cost was reduced, not removed — #220 said otherwise
// and #221 corrected it.
//
// A module-level memo is safe precisely because this module is build-only: each `node scripts/*.mjs`
// process is short-lived and the content cannot change under it. It would NOT be safe in a watch server,
// which is why the cache lives here rather than in `src/lib/content.ts` (that one is a Vite glob, already
// resolved once at module load).
let editionsCache;

// Private (#222). The memo is asserted by COUNTING PARSE CALLS from a fresh module instance
// (`vi.resetModules()` + dynamic import), not by reference identity — identity needed an export, and it
// was a weaker assertion anyway: it stays green for a memo caching the wrong thing as long as it returns
// the same object. #184's justification for exporting — that the alternative was an fs mock shared with
// every other test in the file — was a strawman; module isolation is what removes the sharing.
function blogEditions() {
  // Assignment as a statement, not inside the `return` expression (S1121): the compact
  // `return (cache ??= f())` hides that the line has a side effect, which is the one thing a reader
  // needs to notice about a memo.
  editionsCache ??= readBlogEditions();
  return editionsCache;
}

/**
 * The PURE half of the blog scan: filenames + a reader → the slug pairs. Split out so the parsing rules
 * are testable without touching the filesystem, which is the same injected-reader shape
 * `buildDrafts(files, routes, readFile)` already uses in `gen-distribution.mjs` — one pattern in this
 * directory rather than a per-module improvisation.
 *
 * Three behaviours live here that nothing pinned before (#228), and each silently changes a PUBLISHED URL
 * if it breaks:
 *  - a file that is not `<key>.<locale>.md` is skipped, not guessed at;
 *  - a file with no frontmatter falls back to the filename key as the slug;
 *  - frontmatter without a `slug` does the same — `|| key`, not `?? key`, so an empty string also falls
 *    back rather than producing `/blog/`.
 */
export function buildBlogEditions(files, readFile) {
  const byKey = new Map();
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    const m = /^(.+)\.(pt|en)\.md$/.exec(file);
    if (!m) continue;
    const [, key, locale] = m;
    const raw = readFile(file);
    const fmm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    const fm = fmm ? load(fmm[1]) : null;
    const pair = byKey.get(key) ?? {};
    pair[locale] = fm?.slug || key;
    assertSlugIsUrlSafe(pair[locale], file);
    byKey.set(key, pair);
  }
  return byKey;
}

function readBlogEditions() {
  const byKey = buildBlogEditions(readdirSync(contentDir), (file) => readFileSync(join(contentDir, file), 'utf8'));
  return [...byKey.values()];
}

/**
 * The same slug-shape contract `src/lib/content.ts` enforces (#213), asserted here too because this
 * module re-derives slugs independently — it runs in Node at build time and cannot import the Vite-glob
 * module. Same reason `slugPairIndexOf` re-asserts uniqueness (#208/#211).
 *
 * Keep the pattern identical to SLUG_SHAPE in content.ts. `routes.test.mjs` asserts the two derivations
 * agree on the slugs they produce, so a divergence in what they ACCEPT would surface there.
 *
 * The binding constraint is the dot: `cloudfront-functions/spa-rewrite.js` reads a dot in the last path
 * segment as a FILE, so such a URL is never rewritten to its prerendered index.html — it 404s and
 * `custom_error_response` answers 200 with the home page's OG card, pinned permanently (ADR-0005).
 */
export const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSlugIsUrlSafe(slug, file) {
  if (SLUG_SHAPE.test(slug)) return;
  throw new Error(
    `routes: "${file}" has an unusable slug "${slug}" — a slug becomes a URL segment and must match ` +
      `${SLUG_SHAPE.source}. A dot in particular makes CloudFront serve the home page with a 200 (#213).`,
  );
}

/**
 * Index any-locale slug → its `{ pt, en }` pair, so alternatesFor() can resolve an article route (in
 * either locale) to the reciprocal localized pair. Both directions land the same pair.
 *
 * A slug must identify ONE article (#208/#211). `src/lib/content.ts` enforces this for the app, but this
 * module re-derives slugs independently — it runs in Node at build time and cannot import the Vite-glob
 * module — so the guarantee has to be asserted here too. Without it a duplicate silently overwrote (last
 * write wins) and the SITEMAP advertised the wrong pairing, with no error on the one path that tells
 * Google what exists.
 *
 * Exported as a pure function over the pair list so the throw can be tested with a synthetic collision —
 * the real content is always collision-free, so a test against the glob could never reach it. Same seam,
 * and same reason, as `buildEditions` in src/lib/content.ts.
 */
export function slugPairIndexOf(pairs) {
  const idx = new Map();
  for (const pair of pairs) {
    for (const locale of LOCALES) {
      const seen = idx.get(pair[locale]);
      if (seen && seen !== pair) {
        throw new Error(
          `routes: slug "${pair[locale]}" is claimed by two different articles — a slug must identify ` +
            'one article, or the sitemap and hreflang advertise the wrong pairing.',
        );
      }
      idx.set(pair[locale], pair);
    }
  }
  return idx;
}

// Memoised alongside the parse (#184). Caching only `blogEditions` left this rebuilding a fresh Map on
// EVERY `alternatesFor` call, and gen-sitemap calls that once per route — so the fs read became
// once-per-process while the index stayed once-per-URL.
//
// The shared-Map widening this used to carry is closed (#222): the memo is still one Map, but the
// function is private again, so the only callers are inside this module and none of them mutates it.
// While it was exported, any importer calling `.set`/`.delete` would have corrupted `alternatesFor` for
// the rest of the process — a capability the private function never had, created purely so a test could
// observe the cache.
let indexCache;

// Private (#222) — and UNLIKE the parse memo above, this one is NOT observed by any test in isolation.
// Removing `indexCache ??=` on its own leaves the whole suite green: rebuilding the index runs
// `slugPairIndexOf` over an already-parsed array, so it touches neither the filesystem nor the YAML
// parser, and the parse counter cannot see it. (Removing BOTH memos does go red — so it is guarded in
// combination, unguarded alone.)
//
// Shipped that way deliberately: the alternative was keeping this exported, which handed every importer
// a shared mutable Map. The memo is pure, so losing it would cost performance and never correctness.
// The fix, if it ever matters, is an injected seam like `buildBlogEditions` has — tracked in #264.
function slugPairIndex() {
  indexCache ??= slugPairIndexOf(blogEditions()); // statement, not expression — see blogEditions (S1121)
  return indexCache;
}

// Every real route under both locales: `{ locale, route (logical), url (path to navigate/write) }`. The
// static routes share a path across locales; each ARTICLE carries its locale's OWN slug (per-locale slugs,
// ADR-0037), so `/blog/<slug>` differs by locale. The prerender walks this and the sitemap advertises it,
// so snapshot and sitemap can NEVER drift.
export function localizedRoutes() {
  const editions = blogEditions();
  return LOCALES.flatMap((locale) => [
    ...STATIC_ROUTES.map((route) => ({ locale, route, url: localePath(locale, route) })),
    ...editions.map((pair) => {
      const route = `/blog/${pair[locale]}`;
      return { locale, route, url: localePath(locale, route) };
    }),
  ]);
}

export const SITE_URL = process.env.VITE_SITE_URL?.replace(/\/$/, '') ?? 'https://tadeumendonca.io';

// A locale-prefixed path: localePath('pt', '/me') → '/pt/me', localePath('en', '/') → '/en'.
export const localePath = (locale, route) => (route === '/' ? `/${locale}` : `/${locale}${route}`);

// The absolute self-canonical URL for a (locale, logical route) — never cross-locale.
export const canonicalFor = (locale, route) => `${SITE_URL}${localePath(locale, route)}`;

// The hreflang alternates a logical route exposes: pt + en editions, plus x-default. Article routes carry
// a per-locale slug (ADR-0037), so a `/blog/<slug>` route (in EITHER locale) is resolved through the
// slug→pair index to the reciprocal localized pair — both editions therefore advertise the SAME set.
//
// INVARIANT (#200): x-default must point at a URL the prerender actually SNAPSHOTS. It previously pointed
// at the bare, unprefixed URL for every route, on the reasoning that the client-side redirect resolves it
// per visitor — but only `localizedRoutes()` targets plus the bare ROOT are snapshotted, and CloudFront
// maps 404 → /index.html with response code 200 (iac/frontend.tf). So five of the six advertised
// x-defaults answered 200 carrying the HOME page's OG card and canonical, which a scraper then pins
// permanently (ADR-0005). The article case was worse still: unprefixed paths redirect PRESERVING the path,
// and slugs are per-locale, so a pt-BR reader following `/blog/<en-slug>` landed on `/pt/blog/<en-slug>`
// — a route that does not exist — and fell through to the blog listing.
//
// Hence: the ROOT keeps its bare x-default (it IS prerendered — ADR-0036 chose it as the JS-less crawler's
// entry point); every other route advertises the ENGLISH CANONICAL, which is prerendered and self-consistent.
export const alternatesFor = (route) => {
  // Trailing slash tolerated, matching `articleSlugOf` in src/lib/content.ts (#211) — the two
  // derivations must accept the same shapes or the served HTML and the sitemap describe different sets.
  const blogM = /^\/blog\/([^/]+)\/?$/.exec(route);
  if (blogM) {
    const pair = slugPairIndex().get(blogM[1]);
    if (pair) {
      // The logical route is hoisted per locale rather than interpolated inline: a template literal
      // nested inside another is a Sonar smell (S4624) and, more to the point, it hides which locale's
      // slug is being used at exactly the line where getting that wrong is the #200 bug.
      const ptRoute = `/blog/${pair.pt}`;
      const enRoute = `/blog/${pair.en}`;
      const en = `${SITE_URL}${localePath('en', enRoute)}`;
      return {
        pt: `${SITE_URL}${localePath('pt', ptRoute)}`,
        en,
        'x-default': en,
      };
    }
  }
  const en = `${SITE_URL}${localePath('en', route)}`;
  return {
    pt: `${SITE_URL}${localePath('pt', route)}`,
    en,
    // The bare origin is the ONE unprefixed URL the prerender snapshots (dist/index.html).
    'x-default': route === '/' ? `${SITE_URL}/` : en,
  };
};
