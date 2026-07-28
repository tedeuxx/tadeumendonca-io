import { describe, expect, it } from 'vitest';
import {
  alternatesFor,
  assertSlugIsUrlSafe,
  blogEditions,
  canonicalFor,
  clearBlogEditionsCacheForTest,
  localizedRoutes,
  slugPairIndex,
  slugPairIndexOf,
  LOCALES,
  SITE_URL,
  SLUG_SHAPE,
} from './routes.mjs';
import { getAllPosts, getEditions, SLUG_SHAPE as CONTENT_SLUG_SHAPE } from '../src/lib/content';

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

  // The throw is THE change of #211 — the sitemap path was the one place a duplicate slug resolved by
  // last-write-wins, silently. Tested through the pure seam because the real content is always
  // collision-free, so an assertion against the live glob could never reach it. Same seam and same
  // reasoning as `buildEditions` in src/lib/content.ts, whose collision throws are tested the same way.
  it('throws when two different articles claim the same slug', () => {
    const a = { pt: 'a-pt', en: 'a-en' };
    const b = { pt: 'a-pt', en: 'b-en' }; // b reuses a's pt slug
    expect(() => slugPairIndexOf([a, b])).toThrow(/claimed by two different articles/);
  });

  it('throws on a collision ACROSS locales — A’s pt slug equal to B’s en slug', () => {
    const a = { pt: 'roadmap', en: 'a-en' };
    const b = { pt: 'b-pt', en: 'roadmap' };
    expect(() => slugPairIndexOf([a, b])).toThrow(/slug "roadmap" is claimed by two different articles/);
  });

  // #213 — the shape contract, asserted on THIS derivation too. content.ts covers the app, the tests and
  // the prerender; this module feeds the sitemap, and a slug it accepts but content.ts rejects (or the
  // reverse) is the drift #211 exists to prevent. Same pattern, asserted in both places.
  it('rejects a slug with a dot, naming the CloudFront consequence', () => {
    expect(() => assertSlugIsUrlSafe('node.js-patterns', 'demo.en.md')).toThrow(
      /CloudFront serve the home page/,
    );
  });

  it('rejects the other unusable shapes', () => {
    for (const bad of ['Node-Patterns', 'node patterns', 'node/patterns', '-node', 'node-', 'node--x', 'codigo-límpo']) {
      expect(() => assertSlugIsUrlSafe(bad, 'demo.en.md'), `expected "${bad}" to be rejected`).toThrow();
    }
  });

  it('accepts the shapes real slugs take', () => {
    for (const ok of ['my-commitment', 'meu-compromisso', 'adr-0018', 'ai']) {
      expect(() => assertSlugIsUrlSafe(ok, 'demo.en.md')).not.toThrow();
    }
  });

  // Compared against content.ts's ACTUAL pattern, not a string literal. A literal only guards this side:
  // change content.ts's regex and a literal-based test stays green while the sitemap starts rejecting a
  // slug the app accepts. The title claims the two cannot diverge, so the test has to read both.
  it('uses the SAME pattern as content.ts, so the two derivations cannot diverge on what they accept', () => {
    expect(SLUG_SHAPE.source).toBe(CONTENT_SLUG_SHAPE.source);
    expect(SLUG_SHAPE.flags).toBe(CONTENT_SLUG_SHAPE.flags);
  });

  it('accepts one article reusing the same slug in both editions', () => {
    const idx = slugPairIndexOf([{ pt: 'manifesto', en: 'manifesto' }]);
    expect(idx.get('manifesto')).toEqual({ pt: 'manifesto', en: 'manifesto' });
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

// #184 — blogEditions was called from localizedRoutes, from slugPairIndex, and AGAIN on every
// alternatesFor invocation. gen-sitemap calls the last one per route, so the content directory was
// re-read and re-parsed once per URL: O(articles × calls) where O(articles) will do.
//
// Reference identity is the assertion because it is exactly the property the cache provides, and it is
// false the instant the cache is removed — without the memo every call builds a fresh array. Counting fs
// reads would need a node:fs mock shared with every other test in this file; identity needs no shared
// state and discriminates just as sharply.
describe('the blog directory is parsed once per process (#184)', () => {
  it('returns the SAME array on repeated calls', () => {
    expect(blogEditions()).toBe(blogEditions());
  });

  it('re-reads after the cache is cleared, and produces an equal result', () => {
    const before = blogEditions();
    clearBlogEditionsCacheForTest();
    const after = blogEditions();
    expect(after).not.toBe(before); // a genuinely fresh read…
    expect(after).toEqual(before); // …that parses to the same thing
  });

  // The slug→pair index is memoised too. Caching only the parse left this rebuilding a fresh Map on
  // every alternatesFor call — and gen-sitemap calls that once per route, so the index stayed
  // once-per-URL while the read became once-per-process. Identity is the assertion for the same reason
  // as the parse: without the memo each call constructs a new Map.
  it('builds the slug→pair index once', () => {
    expect(slugPairIndex()).toBe(slugPairIndex());
  });

  // Clearing must drop BOTH caches: the index is derived from the editions, so invalidating one alone
  // would leave an index built over a discarded parse — a stale-cache bug planted by the test seam.
  it('clearing drops the index too, not just the parse', () => {
    const before = slugPairIndex();
    clearBlogEditionsCacheForTest();
    expect(slugPairIndex()).not.toBe(before);
  });
});
