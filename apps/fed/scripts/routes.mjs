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

// The static (non-article) UNPREFIXED logical routes, in a stable order. Real routes only — redirects
// (/blog, /articles, /cv, /profile) must never be snapshotted or advertised, so they are excluded.
const STATIC_ROUTES = ['/', '/me', '/portfolio', '/ramp-up', '/architecture'];

// Read every blog article's PER-LOCALE frontmatter slug, grouped by filename KEY — must match
// src/lib/content.ts (the filename base is the grouping key, slug is per-locale frontmatter, ADR-0037).
// Files are `<key>.<locale>.md`; a missing frontmatter slug falls back to the key. Returns one
// `{ pt, en }` slug pair per article.
function blogEditions() {
  const byKey = new Map();
  for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.md'))) {
    const m = /^(.+)\.(pt|en)\.md$/.exec(file);
    if (!m) continue;
    const [, key, locale] = m;
    const raw = readFileSync(join(contentDir, file), 'utf8');
    const fmm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    const fm = fmm ? load(fmm[1]) : null;
    const pair = byKey.get(key) ?? {};
    pair[locale] = (fm && fm.slug) || key;
    assertSlugIsUrlSafe(pair[locale], file);
    byKey.set(key, pair);
  }
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

function slugPairIndex() {
  return slugPairIndexOf(blogEditions());
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
      const en = `${SITE_URL}${localePath('en', `/blog/${pair.en}`)}`;
      return {
        pt: `${SITE_URL}${localePath('pt', `/blog/${pair.pt}`)}`,
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
