// The single source of truth for the site's public routes at build time. Both the prerender
// (scripts/prerender.mjs) and the sitemap generator (scripts/gen-sitemap.mjs) import from here, so the
// snapshotted HTML and the advertised sitemap URLs can NEVER drift apart — a route enumerated once is
// prerendered and listed together, or neither. Slug derivation must match src/lib/content.ts.
import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content', 'blog');

// Slug from frontmatter (falls back to the filename's slug segment) — must match src/lib/content.ts.
// Files are `<slug>.<locale>.md`, so the locale segment is stripped before the frontmatter fallback.
function slugOf(file) {
  const raw = readFileSync(join(contentDir, file), 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const fm = m ? load(m[1]) : null;
  return (fm && fm.slug) || file.replace(/\.[^.]+\.md$/, '');
}

// Per-locale URLs (ADR-0036): every route is first-class under both prefixes.
export const LOCALES = ['pt', 'en'];

// The UNPREFIXED logical routes, in a stable order. Real routes only — redirects (/blog, /articles,
// /cv, /profile) must never be snapshotted or advertised, so they are deliberately excluded. Each article
// is authored per-locale (`<slug>.pt.md` / `<slug>.en.md`), so the slug set is de-duplicated: one logical
// route per slug, prerendered once PER LOCALE.
export function logicalRoutes() {
  const slugs = [
    ...new Set(
      readdirSync(contentDir)
        .filter((f) => f.endsWith('.md'))
        .map(slugOf),
    ),
  ];
  return ['/', '/me', '/portfolio', '/ramp-up', '/architecture', ...slugs.map((s) => `/blog/${s}`)];
}

// Every logical route under both locales: `{ locale, route (logical), url (path to navigate/write) }`.
// The prerender walks this and the sitemap advertises it, so snapshot and sitemap can NEVER drift.
export function localizedRoutes() {
  return LOCALES.flatMap((locale) => logicalRoutes().map((route) => ({ locale, route, url: localePath(locale, route) })));
}

export const SITE_URL = process.env.VITE_SITE_URL?.replace(/\/$/, '') ?? 'https://tadeumendonca.io';

// A locale-prefixed path: localePath('pt', '/me') → '/pt/me', localePath('en', '/') → '/en'.
export const localePath = (locale, route) => (route === '/' ? `/${locale}` : `/${locale}${route}`);

// The absolute self-canonical URL for a (locale, logical route) — never cross-locale.
export const canonicalFor = (locale, route) => `${SITE_URL}${localePath(locale, route)}`;

// The hreflang alternates a logical route exposes: pt + en editions, plus x-default → the bare,
// unprefixed English URL (the client-side redirect resolves it per visitor). Root maps to the bare origin.
export const alternatesFor = (route) => {
  const bare = route === '/' ? '/' : route;
  return {
    pt: `${SITE_URL}${localePath('pt', route)}`,
    en: `${SITE_URL}${localePath('en', route)}`,
    'x-default': `${SITE_URL}${bare === '/' ? '/' : bare}`,
  };
};
