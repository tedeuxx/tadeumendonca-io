import { describe, expect, it } from 'vitest';
import { alternatesFor, canonicalFor, localizedRoutes, SITE_URL } from './routes.mjs';

// The set of URLs the build actually SNAPSHOTS: every localized route, plus the bare origin (the one
// unprefixed URL prerender.mjs writes, as dist/index.html).
const prerendered = () =>
  new Set([`${SITE_URL}/`, ...localizedRoutes().map((r) => `${SITE_URL}${r.url}`)]);

// The invariant #200 existed for, and the assertion that would have caught it.
//
// x-default used to be the bare, unprefixed URL for every route. Only `localizedRoutes()` plus the bare
// ROOT are prerendered, and CloudFront maps 404 → /index.html with response code 200 (iac/frontend.tf),
// so five of the six advertised x-defaults answered 200 carrying the HOME page's OG card and canonical.
// A scraper pins that card permanently (ADR-0005) — the least reversible failure in this repo.
//
// Membership is the property, not string shape: any future route added to STATIC_ROUTES or any new
// article is covered without editing this test.
describe('every advertised hreflang alternate is a URL the build prerenders', () => {
  const logicalRoutes = () => [...new Set(localizedRoutes().map((r) => r.route))];

  it('holds for pt, en AND x-default, on every route', () => {
    const snapshot = prerendered();
    const offenders = [];
    for (const route of logicalRoutes()) {
      for (const [hreflang, href] of Object.entries(alternatesFor(route))) {
        if (!snapshot.has(href)) offenders.push(`${route} → ${hreflang}=${href}`);
      }
    }
    expect(offenders, `advertised but never prerendered:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('advertises the bare origin as x-default only for the root, which IS prerendered', () => {
    expect(alternatesFor('/')['x-default']).toBe(`${SITE_URL}/`);
    expect(prerendered().has(`${SITE_URL}/`)).toBe(true);
  });

  it('never advertises a bare, unprefixed sub-path — that URL is not snapshotted', () => {
    for (const route of logicalRoutes()) {
      if (route === '/') continue;
      const bare = `${SITE_URL}${route}`;
      expect(Object.values(alternatesFor(route))).not.toContain(bare);
    }
  });
});

describe('alternatesFor — reciprocity and per-locale slugs', () => {
  it('gives both editions of an article the SAME alternate set', () => {
    const article = localizedRoutes().find((r) => r.locale === 'en' && r.route.startsWith('/blog/'));
    if (!article) return; // no articles published yet — nothing to pair
    const pt = localizedRoutes().find((r) => r.locale === 'pt' && r.route.startsWith('/blog/'));
    expect(alternatesFor(article.route)).toEqual(alternatesFor(pt.route));
  });

  it('points x-default at the English canonical for a non-root route', () => {
    expect(alternatesFor('/me')['x-default']).toBe(canonicalFor('en', '/me'));
  });
});
