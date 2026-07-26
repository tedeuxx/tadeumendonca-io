// Build-time sitemap generator. Writes dist/sitemap.xml sharing the exact enumeration the prerender walks
// (scripts/routes.mjs) so the sitemap can never advertise a URL the site doesn't prerender, or miss one it
// does. Runs after `vite build` (needs dist/); browser-free and deterministic. Run: `npm run gen-sitemap`.
//
// Per-locale URLs (ADR-0036): one <url> per (locale, logical route) — routes × locales — each carrying the
// full set of hreflang alternates (pt · en · x-default) as <xhtml:link>. PLUS a single x-default <url> for
// the homepage (the bare origin the client redirect resolves per visitor). Count = routes × locales + 1.
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localizedRoutes, canonicalFor, alternatesFor, SITE_URL } from './routes.mjs';

const dist = resolve(import.meta.dirname, '..', 'dist');
const targets = localizedRoutes();

// The <xhtml:link> alternates block shared by every <url> of a logical route (pt · en · x-default).
const alternateLinks = (route) =>
  Object.entries(alternatesFor(route))
    .map(([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`)
    .join('\n');

const perLocale = targets.map(
  ({ locale, route }) => `  <url>\n    <loc>${canonicalFor(locale, route)}</loc>\n${alternateLinks(route)}\n  </url>`,
);

// The homepage x-default entry: the bare origin, advertising the same alternate set as the localized roots.
const xDefaultRoot = `  <url>\n    <loc>${SITE_URL}/</loc>\n${alternateLinks('/')}\n  </url>`;

const body = [...perLocale, xDefaultRoot].join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;

writeFileSync(join(dist, 'sitemap.xml'), xml);
console.log(`Wrote dist/sitemap.xml with ${targets.length + 1} URLs (routes × locales + x-default root).`);
