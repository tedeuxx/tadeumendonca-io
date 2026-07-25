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

// The public routes, in a stable order. Real routes only — redirects (/blog, /articles, /cv, /profile)
// must never be snapshotted or advertised, so they are deliberately excluded. Each article is authored
// per-locale (`<slug>.pt.md` / `<slug>.en.md`), so the slug set is de-duplicated: one route per slug,
// not one per file — the prerender baseline is a single (English) snapshot per route.
export function publicRoutes() {
  const slugs = [
    ...new Set(
      readdirSync(contentDir)
        .filter((f) => f.endsWith('.md'))
        .map(slugOf),
    ),
  ];
  return ['/', '/me', '/portfolio', '/ramp-up', ...slugs.map((s) => `/blog/${s}`)];
}

export const SITE_URL = process.env.VITE_SITE_URL?.replace(/\/$/, '') ?? 'https://tadeumendonca.io';

// The absolute canonical URL for a route (root keeps its trailing slash).
export const canonicalFor = (route) => (route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`);
