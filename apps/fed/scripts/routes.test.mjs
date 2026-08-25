import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  alternatesFor,
  assertSlugIsUrlSafe,
  buildBlogEditions,
  canonicalFor,
  localizedRoutes,
  slugPairIndexOf,
  LOCALES,
  SITE_URL,
  SLUG_SHAPE,
} from './routes.mjs';
import { getAllPosts, getEditions, SLUG_SHAPE as CONTENT_SLUG_SHAPE } from '../src/lib/content';
import { HELD_SLUGS } from '../src/content/heldFixture';

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

// The sixth public surface (#166). `/library` is one English slug prefixed twice, so it needs no new
// mechanism — which is precisely why it is worth asserting rather than assuming: a route that requires
// nothing special is also a route nothing special would catch. Both editions must be prerendered, and
// the cross-locale ghosts a localized pair would have introduced (`/pt/biblioteca`, `/en/biblioteca`)
// must exist nowhere, since the pair was proposed and declined.
describe('/library — the sixth static route', () => {
  it('is prerendered under BOTH locale prefixes', () => {
    const urls = new Set(localizedRoutes().map((r) => r.url));
    expect(urls).toContain('/pt/library');
    expect(urls).toContain('/en/library');
  });

  it('advertises the same alternate set from either edition, x-default on the English canonical', () => {
    expect(alternatesFor('/library')).toEqual({
      pt: `${SITE_URL}/pt/library`,
      en: `${SITE_URL}/en/library`,
      'x-default': `${SITE_URL}/en/library`,
    });
  });

  // The declined localized pair, asserted as an ABSENCE. Stated because the reversal is recent and a
  // half-reverted routing change fails the same way a half-implemented one does: a stray `/biblioteca`
  // anywhere in the enumeration would be advertised in the sitemap and snapshotted by the prerender.
  it('publishes no Portuguese-slug edition — the localized pair was declined, not half-shipped', () => {
    const routes = localizedRoutes().map((r) => r.url);
    expect(routes.filter((url) => url.includes('biblioteca'))).toEqual([]);
    expect(Object.values(alternatesFor('/library')).filter((url) => url.includes('biblioteca'))).toEqual([]);
  });
});

// #262's defect class, mechanised. The comment block above STATIC_ROUTES counts the routes in prose
// ("App.tsx declares eleven <Route>s and this list holds six of them"), and prose that counts things has
// already gone stale once in this exact file. The numbers are cheap to derive, so they are derived.
describe('the route-count prose above STATIC_ROUTES is still true', () => {
  const appSource = readFileSync(resolve(import.meta.dirname, '..', 'src', 'App.tsx'), 'utf8');

  it('App.tsx declares exactly as many <Route>s as the comment claims', () => {
    const declared = (appSource.match(/<Route\b/g) ?? []).length;
    expect(declared, 'update the comment above STATIC_ROUTES in routes.mjs').toBe(11);
  });

  it('STATIC_ROUTES holds exactly as many logical routes as the comment claims', () => {
    const statics = localizedRoutes().filter((r) => r.locale === 'en' && !r.route.startsWith('/blog/'));
    expect(statics, 'update the comment above STATIC_ROUTES in routes.mjs').toHaveLength(6);
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
// #222 removed the three exports that existed only for this block — `blogEditions`, `slugPairIndex` and
// a `clearBlogEditionsCacheForTest` mutator the build never called. That forced a better assertion, and
// the forcing is the point: with the memo unreachable by reference, the only thing left to measure is
// the property the memo actually delivers — **the content directory is read and parsed once per
// process, however many times the public API is called.**
//
// Reference identity was a proxy for that, and a leaky one: it went green for a memo that cached the
// wrong thing, as long as it returned the same object. Counting parse calls cannot.
//
// `vi.resetModules()` is what makes a per-test mock possible at all — it lives in this module registry
// only, so it is NOT shared with the rest of the file. That sharing was the objection raised when the
// exports were introduced, and it argued for the wrong fix: isolation is what removes it.
//
// One test went away with the seam rather than being ported — "clearing drops the index too". It
// guarded a stale-cache bug that existed only BECAUSE a test could clear one cache and not the other.
// No seam, no bug, nothing to guard.
describe('the blog directory is parsed once per process (#184)', () => {
  // The counter is on `js-yaml`'s `load`, not on `node:fs`. Two reasons, and the second is the one
  // worth remembering: node built-ins expose non-configurable named exports, so `vi.spyOn` throws
  // "Cannot redefine property" and a `doMock` of `node:fs` did not intercept this module's import at
  // all — it produced a spy with **zero** calls, which made one assertion fail loudly and its sibling
  // (comparing a count before and after) pass while comparing 0 to 0. A vacuous green.
  //
  // `load` is also the better subject: the YAML parse is the expensive half of the memo, it is called
  // once per article file, and it is userland so the mock is reliable.
  //
  // `vi.doMock` rather than `vi.mock` because doMock is NOT hoisted: it applies from this call onward,
  // to this freshly reset registry only, which is what keeps the mock out of every other test in the
  // file. The implementation delegates to the real parser, so the module does real work and only the
  // CALL COUNT is instrumentation.
  const withCountedParse = async () => {
    vi.resetModules();
    const load = vi.fn();
    vi.doMock('js-yaml', async (importOriginal) => {
      const actual = await importOriginal();
      load.mockImplementation(actual.load);
      return { ...actual, load };
    });
    const routes = await import('./routes.mjs');
    return { routes, load };
  };

  afterEach(() => vi.doUnmock('js-yaml'));

  it('parses each article once, no matter how many times the routes are asked for', async () => {
    const { routes, load } = await withCountedParse();

    routes.localizedRoutes();
    const afterFirst = load.mock.calls.length;

    // Guards the guard: if the parse never ran, every count below is vacuously equal and this block
    // would pass having measured nothing — which is exactly how the previous version of this test
    // went green against a mock that was not intercepting.
    expect(afterFirst).toBeGreaterThan(0);

    routes.localizedRoutes();
    routes.alternatesFor('/me');
    routes.alternatesFor('/portfolio');
    routes.alternatesFor('/ramp-up');

    // Before the memo this was O(articles × calls) — and gen-sitemap calls alternatesFor once per URL.
    expect(load).toHaveBeenCalledTimes(afterFirst);
  });

  // Resolving an ARTICLE route goes through the slug index, so this covers a path the static routes
  // above do not.
  //
  // Be exact about what it proves, because the obvious reading is wrong: it proves **at least one of the
  // two memos survives**, not the parse memo specifically. Mutation-checked — with only the parse memo
  // removed this test stays GREEN, shielded by the index memo; it goes red only when both are gone. The
  // test above is the one that discriminates the parse memo alone.
  it('resolves an article route repeatedly without re-parsing', async () => {
    const { routes, load } = await withCountedParse();

    const first = routes.alternatesFor('/blog/my-commitment');
    const afterFirst = load.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0); // same anti-vacuity guard as above

    const second = routes.alternatesFor('/blog/my-commitment');
    expect(load).toHaveBeenCalledTimes(afterFirst);
    expect(second).toEqual(first);
  });

  // WHAT IS NO LONGER COVERED, and it is a real cost of #222 rather than an oversight.
  //
  // The slug→pair index has its own memo (`indexCache`). It used to be asserted by reference identity
  // on the exported `slugPairIndex`. With that export gone, the memo is unobservable from outside: the
  // parse memo masks it, because rebuilding the index calls `slugPairIndexOf` over an already-parsed
  // array and touches neither the filesystem nor the YAML parser. Mutation-checked — removing
  // `indexCache ??=` leaves this whole block green.
  //
  // So the index memo now has NO test. That is stated rather than papered over, because #222's own
  // acceptance asked that both memos keep failing when removed, and one of them no longer does.
  // The trade taken deliberately: a permanently exported mutable Map is a worse thing to carry than an
  // untested micro-optimisation in a build-only module, and the index memo is pure — removing it costs
  // performance, never correctness. The tighter fix, if it ever matters, is to make `slugPairIndexOf`
  // count its own invocations through an injected seam, the way `buildBlogEditions` already does.
});

// The blog-scan parsing rules, exercised through the injected-reader seam (#228). Each of these silently
// changes a PUBLISHED URL if it breaks, and none was pinned before: the real content directory always
// holds a complete, well-formed pair, so the corpus can never reach these branches.
describe('buildBlogEditions — the parsing rules', () => {
  const read = (byFile) => (file) => byFile[file];

  it('pairs the two locale editions under the filename KEY', () => {
    const pairs = buildBlogEditions(
      ['demo.pt.md', 'demo.en.md'],
      read({
        'demo.pt.md': '---\nslug: ola-mundo\n---\ncorpo',
        'demo.en.md': '---\nslug: hello-world\n---\nbody',
      }),
    );
    expect(pairs.get('demo')).toEqual({ pt: 'ola-mundo', en: 'hello-world' });
  });

  it('skips a file that is not <key>.<locale>.md rather than guessing at it', () => {
    // `readme.md` and a bad locale are both ignored — a filename the convention does not describe must
    // not become a route by accident.
    const pairs = buildBlogEditions(
      ['readme.md', 'demo.fr.md', 'notes.txt', 'demo.pt.md'],
      read({ 'demo.pt.md': '---\nslug: ola\n---\nx', 'readme.md': 'x', 'demo.fr.md': 'x' }),
    );
    expect([...pairs.keys()]).toEqual(['demo']);
    expect(pairs.get('demo')).toEqual({ pt: 'ola' });
  });

  it('falls back to the filename key when the file has no frontmatter at all', () => {
    const pairs = buildBlogEditions(['demo.en.md'], read({ 'demo.en.md': 'just a body, no fence' }));
    expect(pairs.get('demo')).toEqual({ en: 'demo' });
  });

  it('falls back to the key when frontmatter carries no slug — and when it carries an EMPTY one', () => {
    // `|| key`, not `?? key`: an empty slug must fall back too, or the URL becomes `/blog/`.
    const noSlug = buildBlogEditions(['demo.en.md'], read({ 'demo.en.md': '---\ntag: aws\n---\nbody' }));
    expect(noSlug.get('demo')).toEqual({ en: 'demo' });

    const emptySlug = buildBlogEditions(['demo.en.md'], read({ 'demo.en.md': "---\nslug: ''\n---\nbody" }));
    expect(emptySlug.get('demo')).toEqual({ en: 'demo' });
  });

  it('still enforces the slug shape on a frontmatter slug', () => {
    expect(() =>
      buildBlogEditions(['demo.en.md'], read({ 'demo.en.md': '---\nslug: node.js-patterns\n---\nbody' })),
    ).toThrow(/dot/);
  });

  // #510 — the held key, through the pure seam.
  const held = (slug) => `---\nslug: ${slug}\ndraft: true\n---\nbody`;
  const live = (slug) => `---\nslug: ${slug}\n---\nbody`;

  it('drops a key whose frontmatter carries draft: true', () => {
    const editions = buildBlogEditions(
      ['demo.en.md', 'demo.pt.md'],
      read({ 'demo.en.md': held('demo-en'), 'demo.pt.md': held('demo-pt') }),
    );
    expect(editions.has('demo')).toBe(false);
  });

  // The conservative reading, and it is the one that cannot publish half an article. `content.ts` makes
  // `draft` a fact the two editions must agree on, so this state should be unreachable — but this module
  // re-derives everything independently (it runs in Node and cannot import the Vite-glob module), so the
  // two CAN disagree, and the answer that does not advertise a URL for a half-held article is the safe one.
  it('drops the key when ANY edition is held, in either order', () => {
    const ptHeld = buildBlogEditions(
      ['demo.en.md', 'demo.pt.md'],
      read({ 'demo.en.md': live('demo-en'), 'demo.pt.md': held('demo-pt') }),
    );
    const enHeld = buildBlogEditions(
      ['demo.en.md', 'demo.pt.md'],
      read({ 'demo.en.md': held('demo-en'), 'demo.pt.md': live('demo-pt') }),
    );
    expect(ptHeld.has('demo')).toBe(false);
    expect(enHeld.has('demo')).toBe(false);
  });

  // Dropping must not become a blanket. Without this, "drop everything" passes every assertion above.
  it('keeps every key that is not held, alongside one that is', () => {
    const editions = buildBlogEditions(
      ['a.en.md', 'b.en.md'],
      read({ 'a.en.md': held('a-en'), 'b.en.md': live('b-en') }),
    );
    expect([...editions.keys()]).toEqual(['b']);
  });

  // A held slug is still validated. Deferring the shape check to promotion would move a build break into
  // the one commit nobody wants to discover one in — the commit that publishes.
  it('still enforces the slug shape on a HELD article, before dropping it', () => {
    expect(() =>
      buildBlogEditions(['demo.en.md'], read({ 'demo.en.md': '---\nslug: node.js-patterns\ndraft: true\n---\nbody' })),
    ).toThrow(/dot/);
  });
});

// #510 — ACCEPTANCE CRITERIA 1 AND 2, at their source.
//
// `localizedRoutes()` is the single enumeration BOTH the sitemap generator and the prerender walk, which
// is why the two can never drift. So "zero sitemap entries" and "zero prerendered routes" are one property
// here, asserted against the real committed fixture rather than a synthetic pair. The served artifacts are
// asserted separately in `e2e/held-draft.spec.ts`, against the built site — this block proves the decision,
// that one proves the output.
//
// MUTATION: flipping the fixture's `draft: true` to `false` makes both assertions below red.
describe('a held article leaves the sitemap and the prerender together', () => {
  const articleRoutes = () => localizedRoutes().filter((r) => r.route.startsWith('/blog/'));

  it('contributes no route in either locale', () => {
    const routes = articleRoutes().map((r) => r.route);
    for (const locale of LOCALES) {
      expect(routes, `${locale}: the held fixture must not be enumerated`).not.toContain(
        `/blog/${HELD_SLUGS[locale]}`,
      );
    }
  });

  // Guards the vacuous read of the assertion above: `not.toContain` over an empty list is true, and an
  // empty article-route list is what a broken content scan produces.
  it('leaves the published articles enumerated — the list is not simply empty', () => {
    expect(articleRoutes().length).toBeGreaterThan(0);
  });

  // The sitemap and the prerender shrink TOGETHER, which is the never-drift invariant this module opens
  // with. Counted against `content.ts`'s own published list rather than against a literal: the failure it
  // rules out is a hold applied to one derivation and not the other, and a hard-coded expected count
  // would go stale the day an article is published and stop measuring anything.
  it('enumerates exactly the published articles — one route per locale, held ones excluded', () => {
    expect(articleRoutes()).toHaveLength(getAllPosts('en').length * LOCALES.length);
  });
});
