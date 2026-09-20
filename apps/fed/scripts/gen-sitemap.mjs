// Build-time sitemap generator. Writes dist/sitemap.xml sharing the exact enumeration the prerender walks
// (scripts/routes.mjs) so the sitemap can never advertise a URL the site doesn't prerender, or miss one it
// does. Runs after `vite build` (needs dist/); browser-free and deterministic. Run: `npm run gen-sitemap`.
//
// Per-locale URLs (ADR-0036): one <url> per (locale, logical route) — routes × locales — each carrying the
// full set of hreflang alternates (pt · en · x-default) as <xhtml:link>. PLUS a single x-default <url> for
// the homepage (the bare origin the client redirect resolves per visitor), PLUS one <url> per article for
// its NEUTRAL share address (#660). Count = routes × locales + articles + 1.
//
// The neutral URLs are listed for the same reason the invariant at the top of routes.mjs exists, read the
// other way round: they are ADVERTISED — each article's x-default now names one — and they are
// PRERENDERED, so listing them keeps the sitemap describing the same set the build produced. Leaving
// them out would advertise a URL in hreflang that the sitemap denies, which is the drift this generator
// shares an enumeration to prevent.
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localizedRoutes, neutralArticleRoutes, canonicalFor, alternatesFor, SITE_URL } from './routes.mjs';

const dist = resolve(import.meta.dirname, '..', 'dist');
const targets = localizedRoutes();
const neutralTargets = neutralArticleRoutes();

// The <xhtml:link> alternates block shared by every <url> of a logical route (pt · en · x-default).
const alternateLinks = (route) =>
  Object.entries(alternatesFor(route))
    .map(([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`)
    .join('\n');

const perLocale = targets.map(
  ({ locale, route }) => `  <url>\n    <loc>${canonicalFor(locale, route)}</loc>\n${alternateLinks(route)}\n  </url>`,
);

// The neutral share URLs (#660, ADR-0052). `alternateLinks(route)` is called with the SAME logical article route
// the two prefixed editions use, so all three <url> entries carry a byte-identical alternate block —
// which is the reciprocity a crawler needs to pair them, and the reason this is a lookup rather than a
// third construction.
const neutral = neutralTargets.map(
  ({ route, url }) => `  <url>\n    <loc>${SITE_URL}${url}</loc>\n${alternateLinks(route)}\n  </url>`,
);

// The homepage x-default entry: the bare origin, advertising the same alternate set as the localized roots.
const xDefaultRoot = `  <url>\n    <loc>${SITE_URL}/</loc>\n${alternateLinks('/')}\n  </url>`;

const body = [...perLocale, ...neutral, xDefaultRoot].join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;

writeFileSync(join(dist, 'sitemap.xml'), xml);
console.log(
  `Wrote dist/sitemap.xml with ${targets.length + neutralTargets.length + 1} URLs ` +
    '(routes × locales + neutral share URLs + x-default root).',
);
