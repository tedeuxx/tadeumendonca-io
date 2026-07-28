import { describe, expect, it } from 'vitest';
import { alternatesFor, canonicalFor, localizedRoutes, LOCALES, SITE_URL } from './routes.mjs';
import { getAllPosts, getEditions } from '../src/lib/content';

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

  it('tolerates a trailing slash, like content.ts does (#211)', () => {
    const article = localizedRoutes().find((r) => r.locale === 'en' && r.route.startsWith('/blog/'));
    if (!article) return;
    expect(alternatesFor(`${article.route}/`)).toEqual(alternatesFor(article.route));
  });
});

// #211 — this module re-derives slugs INDEPENDENTLY of src/lib/content.ts. It runs in Node at build time
// and cannot import the app's Vite-glob module, so the duplication is forced by the runtime split, not a
// choice. What is not forced is letting the two drift: `routes.mjs` feeds the sitemap and the prerender,
// `content.ts` feeds the served HTML, and if they disagree the site advertises a different URL set than it
// serves — which is the exact class of defect #200 turned out to be.
//
// So the guarantee is not "one implementation", it is "two implementations that provably agree".
describe('routes.mjs and content.ts derive the SAME slugs', () => {
  it('agrees on every locale’s article slug set', () => {
    for (const locale of LOCALES) {
      const fromRoutes = localizedRoutes()
        .filter((r) => r.locale === locale && r.route.startsWith('/blog/'))
        .map((r) => r.route.replace('/blog/', ''))
        .sort();
      const fromContent = getAllPosts(locale)
        .map((p) => p.slug)
        .sort();
      expect(fromRoutes, `${locale}: routes.mjs and content.ts disagree on the article slugs`).toEqual(
        fromContent,
      );
    }
  });

  it('agrees on the reciprocal PAIRING, not merely on the slug set', () => {
    // Identical slug sets would still be wrong if the two derivations paired the editions differently —
    // routes.mjs could hand article A's en slug article B's pt slug and the set assertion above would
    // still pass. So compare the pairing itself, resolved through content.ts's own edition group.
    for (const post of getAllPosts('en')) {
      const expected = getEditions(post.slug, 'en');
      expect(expected, `content.ts has no edition group for "${post.slug}"`).toBeDefined();
      const alt = alternatesFor(`/blog/${post.slug}`);
      expect(alt.pt).toBe(`${SITE_URL}/pt/blog/${expected.pt.slug}`);
      expect(alt.en).toBe(`${SITE_URL}/en/blog/${expected.en.slug}`);
    }
  });
});
