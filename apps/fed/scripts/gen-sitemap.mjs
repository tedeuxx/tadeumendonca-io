// Build-time sitemap generator. Writes dist/sitemap.xml with one <loc> per public route, sharing the
// exact enumeration the prerender walks (scripts/routes.mjs) so the sitemap can never advertise a URL the
// site doesn't prerender, or miss one it does. Runs after `vite build` (needs dist/); browser-free and
// deterministic. Run: `npm run gen-sitemap` (chained into `build`).
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { publicRoutes, canonicalFor } from './routes.mjs';

const dist = resolve(import.meta.dirname, '..', 'dist');
const routes = publicRoutes();

const body = routes
  .map((route) => `  <url>\n    <loc>${canonicalFor(route)}</loc>\n  </url>`)
  .join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(dist, 'sitemap.xml'), xml);
console.log(`Wrote dist/sitemap.xml with ${routes.length} URLs.`);
