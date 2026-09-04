// `nav_click`'s `from` dimension (#597) — a path classified into the closed `NavArea` vocabulary.
//
// WHY A CLASSIFIER AND NOT THE PATH ITSELF. ADR-0051 keeps `path` off the spine because GA4 derives
// `page_path` from `page_location` for free, and a custom copy spends a registration slot on a
// duplicate. `from` is not that duplicate: it is the path of the page the reader is LEAVING, which no
// hit carries, and the only reason it may be emitted at all is that this function collapses it to a
// bounded set first. A `from` that carried a raw pathname would be `path` reintroduced under a new name
// — with a query string reachable, which is the thing the rule is actually protecting against.
//
// TOTAL BY CONSTRUCTION. Every input returns a `NavArea`; there is no null and no throw, so a caller
// cannot be tempted into a fallback that emits something wider. A route this site does not have yet
// arrives as `other`, which is a value that says "unclassified" rather than a value that leaks the URL.
// The cost is stated rather than discovered: a new public route added without a line in the table below
// is silently reported as `other`, and nothing reddens. That is the safe direction — a new route is
// under-attributed, never mis-attributed — and `navArea.test.ts` asserts the table against the router's
// own route list so the gap is at least visible to anyone who reads the test.
import { pathWithoutLocale } from '../i18n/config';
import type { NavArea } from './analytics';

/**
 * The LOGICAL (locale-stripped) path of every public route that has its own area, exactly as `App.tsx`
 * spells it. Locale-stripped because `/pt/me` and `/en/me` are one page type in two editions, and the
 * edition is already the `locale` dimension on the same event — reporting it twice would split every
 * `from` in half for nothing.
 */
const AREA_BY_LOGICAL_PATH: Readonly<Record<string, NavArea>> = {
  '/': 'home',
  '/portfolio': 'portfolio',
  '/ramp-up': 'ramp-up',
  '/architecture': 'architecture',
  '/library': 'library',
  '/me': 'me',
};

/** The article route's prefix — every `/blog/<slug>` collapses to one area. See `NavArea` for why the
 *  slug is deliberately not carried. */
const ARTICLE_PREFIX = '/blog/';

/**
 * Classify a router pathname into the `nav_click` vocabulary.
 *
 * Takes a PATHNAME, never a URL or a `Location`: a query string and a fragment cannot enter this
 * function, so they cannot leave it. `pathWithoutLocale` returns `''` for a bare locale root (`/pt`),
 * which normalises to `/` below; a trailing slash is trimmed so `/pt/me/` and `/pt/me` are one area
 * rather than two (the router serves both).
 */
export function navArea(pathname: string): NavArea {
  const stripped = pathWithoutLocale(pathname).replace(/\/+$/, '');
  const logical = stripped === '' ? '/' : stripped;
  if (logical.startsWith(ARTICLE_PREFIX)) return 'article';
  return AREA_BY_LOGICAL_PATH[logical] ?? 'other';
}
