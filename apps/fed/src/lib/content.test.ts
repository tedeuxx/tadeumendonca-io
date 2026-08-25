import { describe, it, expect } from 'vitest';
import {
  getAllPosts,
  getPostBySlug,
  getEditions,
  alternateSlug,
  localizeArticlePath,
  articlePathForLocale,
  supersededSlugTarget,
  buildEditions,
  type BlogPost,
} from './content';
import { LOCALES } from '../i18n/config';
import { HELD_NONCES, HELD_SLUGS } from '../content/heldFixture';

// Slugs are per-locale now (ADR-0037): the EN edition and the PT edition of the one live article carry
// DIFFERENT slugs. The filename KEY (the canonical English slug) is the grouping identity.
const EN_SLUG = 'my-commitment';
const PT_SLUG = 'meu-compromisso';

// Extract the ordered list of markdown links from a body, for the cross-locale parity assertion.
const linksOf = (body: string) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
// Count the `##` sections — the article's structural skeleton must be identical across editions.
const sectionsOf = (body: string) => (body.match(/^##\s/gm) ?? []).length;

// Exercises the real glob + frontmatter parse against the seeded markdown in content/blog.
describe('content (markdown-in-repo, per-locale)', () => {
  it('loads the seeded post in each locale with its own prose', () => {
    const en = getPostBySlug(EN_SLUG, 'en');
    const pt = getPostBySlug(PT_SLUG, 'pt');
    expect(en).toBeDefined();
    expect(pt).toBeDefined();
    expect(en?.title).toBe('My Commitment');
    expect(pt?.title).toBe('Meu Compromisso');
    expect(en?.body).toContain('The commitment');
    expect(pt?.body).toContain('O compromisso');
    expect(en?.body).not.toContain('---'); // frontmatter fence stripped
  });

  it('carries a per-locale slug (NOT shared) while the remaining facts stay shared', () => {
    const en = getPostBySlug(EN_SLUG, 'en')!;
    const pt = getPostBySlug(PT_SLUG, 'pt')!;
    // Slug is per-locale (ADR-0037): the two editions legitimately differ on it.
    expect(en.slug).toBe('my-commitment');
    expect(pt.slug).toBe('meu-compromisso');
    expect(en.slug).not.toBe(pt.slug);
    // The remaining facts are still authored once and shared.
    expect(en.date).toBe('2026-07-26T22:00:00.000Z'); // stayed a string (not a YAML Date)
    expect(en.date).toBe(pt.date);
    expect(en.tag).toBe(pt.tag);
    expect(en.track).toBe(pt.track);
  });

  it('keeps each edition free of the other locale prose (no leak)', () => {
    const en = getPostBySlug(EN_SLUG, 'en')!;
    const pt = getPostBySlug(PT_SLUG, 'pt')!;
    expect(en.body).not.toContain('O compromisso');
    expect(pt.body).not.toContain('The commitment');
    expect(en.title).not.toContain('Compromisso');
    expect(pt.title).not.toContain('Commitment');
  });

  it('has the same links in the same order, and the same section count, across locales', () => {
    const en = getPostBySlug(EN_SLUG, 'en')!;
    const pt = getPostBySlug(PT_SLUG, 'pt')!;
    expect(linksOf(en.body)).toEqual(linksOf(pt.body));
    expect(sectionsOf(en.body)).toBe(sectionsOf(pt.body));
    expect(sectionsOf(en.body)).toBeGreaterThan(0);
  });

  it('parses the track and the reader-first takeaway', () => {
    const post = getPostBySlug(EN_SLUG, 'en')!;
    expect(post.track).toBe('engenharia');
    expect(post.takeaway).toBeTruthy();
  });

  it('defaults the optional fields conservatively', () => {
    const post = getPostBySlug(EN_SLUG, 'en')!;
    expect(post.hasVideo).toBe(false); // an absent flag is never truthy
    expect(post.linkedinUrl).toBeUndefined();
    expect(post.cover).toBeUndefined();
  });

  it('returns undefined for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist', 'en')).toBeUndefined();
  });

  it('does not resolve one locale slug under the other locale (slugs are per-locale)', () => {
    // The EN slug is not a PT slug and vice-versa — this is exactly why the old shared-slug URL
    // `/en/blog/meu-compromisso` is now a not-found.
    expect(getPostBySlug(PT_SLUG, 'en')).toBeUndefined();
    expect(getPostBySlug(EN_SLUG, 'pt')).toBeUndefined();
  });

  it('filters by tag and returns [] for an unknown tag', () => {
    expect(getAllPosts('en', { tag: 'manifesto' }).length).toBeGreaterThan(0);
    expect(getAllPosts('en', { tag: 'does-not-exist' })).toEqual([]);
  });

  it('filters by track', () => {
    expect(getAllPosts('en', { track: 'engenharia' }).length).toBeGreaterThan(0);
    expect(getAllPosts('en', { track: 'pessoal' })).toEqual([]);
  });

  it('returns everything when no filter is given', () => {
    expect(getAllPosts('en').length).toBeGreaterThan(0);
    expect(getAllPosts('en', {})).toEqual(getAllPosts('en'));
  });
});

// The unpublishable contract, exercised directly against buildEditions with synthetic inputs — the
// real glob is always a complete, agreeing pair, so these are the only way to prove the throws are real.
describe('the unpublishable contract (buildEditions)', () => {
  const fm = (over: Partial<Record<string, string>> = {}) =>
    `---\nslug: ${over.slug ?? 'demo'}\ntitle: ${over.title ?? 'T'}\ndate: '2026-01-01T00:00:00.000Z'\ntag: ${over.tag ?? 'aws'}\ntrack: engenharia\n---\nbody`;

  it('accepts a complete, agreeing pt/en pair', () => {
    const editions = buildEditions({
      '../content/blog/demo.pt.md': fm({ title: 'PT' }),
      '../content/blog/demo.en.md': fm({ title: 'EN' }),
    });
    expect(editions.demo.pt.title).toBe('PT');
    expect(editions.demo.en.title).toBe('EN');
  });

  // `asTrack` accepts a known track and falls back to 'engenharia' for anything else. Nothing pinned
  // that: every fixture and every real article carries `track: engenharia`, which is ALSO the fallback,
  // so both branches of the ternary returned the same value and the suite could not tell a working
  // membership test from one that always answered false. `pessoal` is the only input that distinguishes
  // them, which is why it has to be asserted explicitly rather than left to the corpus.
  it('keeps a known track and falls back to engenharia for an unknown one', () => {
    const withTrack = (track: string) =>
      `---\nslug: demo\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: ${track}\n---\nbody`;
    const parsed = (track: string) =>
      buildEditions({
        '../content/blog/demo.pt.md': withTrack(track),
        '../content/blog/demo.en.md': withTrack(track),
      }).demo.en.track;

    expect(parsed('pessoal')).toBe('pessoal'); // fails if TRACKS never matches
    expect(parsed('engenharia')).toBe('engenharia');
    expect(parsed('nonsense')).toBe('engenharia'); // fails if TRACKS matches everything
  });

  it('throws when a slug is missing a locale', () => {
    expect(() => buildEditions({ '../content/blog/demo.pt.md': fm() })).toThrow(/missing the en edition/);
  });

  it('throws when a file carries a locale outside LOCALES', () => {
    expect(() => buildEditions({ '../content/blog/demo.fr.md': fm() })).toThrow(/locale "fr"/);
  });

  it('throws when the filename is not <slug>.<locale>.md', () => {
    expect(() => buildEditions({ '../content/blog/demo.md': fm() })).toThrow(/unexpected blog filename/);
  });

  // #213 — a slug becomes a URL segment, and the edge constrains it. The binding case is the DOT:
  // spa-rewrite.js reads a dot in the last segment as a FILE, so the URL is not rewritten to the
  // prerendered index.html, 404s, and custom_error_response answers 200 with the HOME page — its OG card
  // pinned permanently on the article (ADR-0005). Invisible locally, because vite preview serves the SPA
  // fallback for everything.
  it('throws on a slug containing a dot, naming the CloudFront consequence', () => {
    expect(() =>
      buildEditions({
        '../content/blog/demo.pt.md': fm({ slug: 'node.js-patterns' }),
        '../content/blog/demo.en.md': fm({ slug: 'node.js-patterns' }),
      }),
    ).toThrow(/dot makes CloudFront treat the URL as a FILE/);
  });

  // The message written for the Portuguese author — the reader most likely to hit this rule. Asserted on
  // its own text, not merely on "it throws": "ó" IS a lowercase letter, so the generic message would tell
  // them the validator is wrong. Half the content is pt, so this branch must say why.
  it('throws on a non-ASCII slug, explaining the encoding mismatch rather than "lowercase"', () => {
    expect(() =>
      buildEditions({
        '../content/blog/demo.pt.md': fm({ slug: 'codigo-limpo-nao' }),
        '../content/blog/demo.en.md': fm({ slug: 'código-limpo' }),
      }),
    ).toThrow(/percent-encodes/);
  });

  it.each([
    ['UPPERCASE', 'Node-Patterns'],
    ['a space', 'node patterns'],
    ['a slash', 'node/patterns'],
    ['a leading hyphen', '-node'],
    ['a trailing hyphen', 'node-'],
    ['a doubled hyphen', 'node--patterns'],
  ])('throws on %s', (_label, slug) => {
    expect(() =>
      buildEditions({
        '../content/blog/demo.pt.md': fm({ slug }),
        '../content/blog/demo.en.md': fm({ slug }),
      }),
    ).toThrow(/unusable/);
  });

  // Not a validation case: an omitted or empty `slug:` is null in YAML, so `?? fileSlug` falls back to
  // the filename KEY. Asserted because it is the reason the empty string is unreachable through
  // frontmatter — and because the fallback is itself validated: a key with a dot would be rejected too.
  it('falls back to the filename key when the slug is omitted, and validates THAT', () => {
    const noSlug = "---\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\n---\nbody";
    const editions = buildEditions({
      '../content/blog/demo.pt.md': noSlug,
      '../content/blog/demo.en.md': noSlug,
    });
    expect(editions.demo.pt.slug).toBe('demo');
  });

  it('accepts the shapes real slugs take', () => {
    for (const slug of ['my-commitment', 'meu-compromisso', 'adr-0018', 'ai']) {
      expect(() =>
        buildEditions({
          '../content/blog/demo.pt.md': fm({ slug }),
          '../content/blog/demo.en.md': fm({ slug }),
        }),
      ).not.toThrow();
    }
  });

  // #208 — the slug is what every lookup resolves on (`.find` in getPostBySlug/getEditions), so a slug
  // shared by two KEYS silently shadows: one article unreachable, and the cross-locale mappers able to
  // hand a reader the wrong piece with no error. Both collision shapes are the same defect.
  it('throws when two different articles claim the same slug WITHIN a locale', () => {
    expect(() =>
      buildEditions({
        '../content/blog/one.pt.md': fm({ slug: 'shared' }),
        '../content/blog/one.en.md': fm({ slug: 'one-en' }),
        '../content/blog/two.pt.md': fm({ slug: 'shared' }),
        '../content/blog/two.en.md': fm({ slug: 'two-en' }),
      }),
    ).toThrow(/slug "shared" is claimed by two different articles/);
  });

  it('throws when article A’s pt slug collides with article B’s en slug', () => {
    expect(() =>
      buildEditions({
        '../content/blog/one.pt.md': fm({ slug: 'roadmap' }),
        '../content/blog/one.en.md': fm({ slug: 'one-en' }),
        '../content/blog/two.pt.md': fm({ slug: 'two-pt' }),
        '../content/blog/two.en.md': fm({ slug: 'roadmap' }),
      }),
    ).toThrow(/slug "roadmap" is claimed by two different articles/);
  });

  it('ALLOWS one article reusing the same slug in both editions — a title needing no translation', () => {
    const editions = buildEditions({
      '../content/blog/manifesto.pt.md': fm({ slug: 'manifesto' }),
      '../content/blog/manifesto.en.md': fm({ slug: 'manifesto' }),
    });
    expect(editions.manifesto.pt.slug).toBe('manifesto');
    expect(editions.manifesto.en.slug).toBe('manifesto');
  });

  it('throws when the two editions disagree on a fact', () => {
    expect(() =>
      buildEditions({
        '../content/blog/demo.pt.md': fm({ tag: 'aws' }),
        '../content/blog/demo.en.md': fm({ tag: 'llm' }),
      }),
    ).toThrow(/disagrees on the fact "tag"/);
  });
});

// The BlogPost shape returned to consumers stays single-language / resolved.
it('returns a resolved single-language BlogPost', () => {
  const post: BlogPost | undefined = getPostBySlug(EN_SLUG, 'en');
  expect(typeof post?.body).toBe('string');
});

// Per-locale slug helpers (ADR-0037): the edition group lookup + the cross-locale slug/path mappers that
// the toggle and hreflang depend on.
describe('per-locale slug helpers', () => {
  it('getEditions finds the group by a locale’s OWN slug, in either locale', () => {
    const fromEn = getEditions(EN_SLUG, 'en');
    const fromPt = getEditions(PT_SLUG, 'pt');
    expect(fromEn?.en.slug).toBe(EN_SLUG);
    expect(fromEn?.pt.slug).toBe(PT_SLUG);
    // Looking up by either locale's slug resolves to the SAME edition group.
    expect(fromPt).toEqual(fromEn);
  });

  it('getEditions returns undefined for an unknown slug, and for the wrong-locale slug', () => {
    expect(getEditions('nope', 'en')).toBeUndefined();
    // EN_SLUG is not a PT edition's slug, so a pt lookup by it finds nothing.
    expect(getEditions(EN_SLUG, 'pt')).toBeUndefined();
  });

  it('alternateSlug maps a slug across locales in both directions', () => {
    expect(alternateSlug(EN_SLUG, 'en', 'pt')).toBe(PT_SLUG);
    expect(alternateSlug(PT_SLUG, 'pt', 'en')).toBe(EN_SLUG);
    // Same-locale is the identity; an unknown slug maps to undefined.
    expect(alternateSlug(EN_SLUG, 'en', 'en')).toBe(EN_SLUG);
    expect(alternateSlug('nope', 'en', 'pt')).toBeUndefined();
  });

  it('localizeArticlePath rewrites a /blog/<slug> path across locales', () => {
    expect(localizeArticlePath(`/blog/${EN_SLUG}`, 'en', 'pt')).toBe(`/blog/${PT_SLUG}`);
    expect(localizeArticlePath(`/blog/${PT_SLUG}`, 'pt', 'en')).toBe(`/blog/${EN_SLUG}`);
  });

  it('localizeArticlePath passes non-article paths and unknown slugs through unchanged', () => {
    expect(localizeArticlePath('/me', 'en', 'pt')).toBe('/me');
    expect(localizeArticlePath('/', 'en', 'pt')).toBe('/');
    expect(localizeArticlePath('', 'en', 'pt')).toBe('');
    expect(localizeArticlePath('/blog', 'en', 'pt')).toBe('/blog'); // the retired list route, not an article
    expect(localizeArticlePath('/blog/unknown', 'en', 'pt')).toBe('/blog/unknown');
  });

  // #204 — the unprefixed redirect's variant. Unlike the locale toggle, it does NOT know which locale the
  // incoming slug belongs to (`/blog/<slug>` carries no prefix), so it must resolve from either direction.
  // Re-prefixing blindly is what dead-ended a pt-BR reader on `/pt/blog/<en-slug>`.
  describe('articlePathForLocale (no source locale known)', () => {
    it('maps an ENGLISH slug to the pt edition, for a pt-BR reader', () => {
      expect(articlePathForLocale(`/blog/${EN_SLUG}`, 'pt')).toBe(`/blog/${PT_SLUG}`);
    });

    it('maps a PORTUGUESE slug to the en edition, for an English reader', () => {
      expect(articlePathForLocale(`/blog/${PT_SLUG}`, 'en')).toBe(`/blog/${EN_SLUG}`);
    });

    it('leaves a slug that already matches the target locale alone', () => {
      expect(articlePathForLocale(`/blog/${EN_SLUG}`, 'en')).toBe(`/blog/${EN_SLUG}`);
      expect(articlePathForLocale(`/blog/${PT_SLUG}`, 'pt')).toBe(`/blog/${PT_SLUG}`);
    });

    it('passes non-article paths and unknown slugs through, preserving the in-locale not-found', () => {
      expect(articlePathForLocale('/me', 'pt')).toBe('/me');
      expect(articlePathForLocale('/', 'pt')).toBe('/');
      expect(articlePathForLocale('/blog', 'pt')).toBe('/blog');
      expect(articlePathForLocale('/blog/unknown', 'pt')).toBe('/blog/unknown');
    });

    // #208 — a trailing slash is a form browsers and link handlers produce constantly. Without tolerating
    // it, `/blog/<slug>/` fell through unmapped and re-prefixed verbatim: the exact #204 dead end,
    // surviving on a punctuation difference. Normalised away, so the reader lands on the canonical form.
    it('maps a path with a trailing slash, and normalises the slash away', () => {
      expect(articlePathForLocale(`/blog/${EN_SLUG}/`, 'pt')).toBe(`/blog/${PT_SLUG}`);
      expect(articlePathForLocale(`/blog/${PT_SLUG}/`, 'en')).toBe(`/blog/${EN_SLUG}`);
      expect(localizeArticlePath(`/blog/${EN_SLUG}/`, 'en', 'pt')).toBe(`/blog/${PT_SLUG}`);
    });

    // #208 — resolution must not depend on how LOCALES happens to be declared. A slug already valid in
    // the TARGET locale is the answer that cannot be wrong, so it wins before any cross-locale guess.
    // buildEditions now rejects a real collision at build time; this is the second layer.
    it('resolves target-locale-first, so a valid target slug is authoritative', () => {
      expect(articlePathForLocale(`/blog/${PT_SLUG}`, 'pt')).toBe(`/blog/${PT_SLUG}`);
      expect(articlePathForLocale(`/blog/${EN_SLUG}`, 'en')).toBe(`/blog/${EN_SLUG}`);
    });
  });
});

// A slug that was PUBLISHED and has since been corrected. ADR-0037 made an article slug per-locale and
// therefore editable; ADR-0010 says a URL already in the world keeps resolving. `previousSlugs` is where
// those two meet, and these are the unit-level halves of that contract — the browser-level half (the actual
// redirect) is `routes.spec.ts`, because a `<Navigate>` is only real in a router.
describe('superseded slugs (the back-compat contract for a corrected URL)', () => {
  // Frontmatter helper carrying a retired slug. Kept local rather than widening the shared `fm` above:
  // every other test in this file asserts against articles that have never moved, and threading an extra
  // optional field through them would make the common case read like the exception.
  const withRetired = (slug: string, retired: string[]) =>
    `---\nslug: ${slug}\npreviousSlugs:\n${retired.map((r) => `  - ${r}`).join('\n')}\n` +
    `title: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\n---\nbody`;

  const plain = (slug: string) =>
    `---\nslug: ${slug}\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\n---\nbody`;

  describe('parsing', () => {
    it('defaults to an empty list, so an article that never moved carries no redirect', () => {
      const editions = buildEditions({
        '../content/blog/demo.pt.md': plain('demo-pt'),
        '../content/blog/demo.en.md': plain('demo-en'),
      });
      expect(editions.demo.pt.previousSlugs).toEqual([]);
      expect(editions.demo.en.previousSlugs).toEqual([]);
    });

    it('reads a list, and accepts more than one correction of the same edition', () => {
      const editions = buildEditions({
        '../content/blog/demo.pt.md': withRetired('demo-pt', ['first-pt', 'second-pt']),
        '../content/blog/demo.en.md': plain('demo-en'),
      });
      expect(editions.demo.pt.previousSlugs).toEqual(['first-pt', 'second-pt']);
    });

    // A bare scalar is what an author writes for the single-correction case, which is nearly every case.
    // Rejecting it would be defensible; SILENTLY dropping it would not, and that is what `Array.isArray`
    // alone would have done — leaving a published URL dead with a green build.
    it('accepts a bare scalar as a one-entry list', () => {
      const editions = buildEditions({
        '../content/blog/demo.pt.md': `---\nslug: demo-pt\npreviousSlugs: only-pt\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\n---\nbody`,
        '../content/blog/demo.en.md': plain('demo-en'),
      });
      expect(editions.demo.pt.previousSlugs).toEqual(['only-pt']);
    });
  });

  describe('validation', () => {
    // A retired slug is the URL a reader is ACTUALLY on when the redirect fires, so an unusable one is
    // worse than an unusable current slug: the article is reachable and the only address anyone holds is
    // the broken one. Same shape rules, same reasons (#213).
    it('rejects an unusable retired slug, and says which field it came from', () => {
      expect(() =>
        buildEditions({
          '../content/blog/demo.pt.md': withRetired('demo-pt', ['node.js-era']),
          '../content/blog/demo.en.md': plain('demo-en'),
        }),
      ).toThrow(/unusable pt previousSlugs entry "node\.js-era".*CloudFront/s);
    });

    it('rejects an article that lists its own current slug as retired — the redirect would target itself', () => {
      expect(() =>
        buildEditions({
          '../content/blog/demo.pt.md': withRetired('demo-pt', ['demo-pt']),
          '../content/blog/demo.en.md': plain('demo-en'),
        }),
      ).toThrow(/lists "demo-pt" as a retired pt slug, but that slug is still published/);
    });

    // Caught by the COLLISION guard rather than the still-published one, and the message is asserted as
    // it actually reads instead of as the nicer one you would expect: the two articles have different
    // keys, so the ownership check reaches it first. Recorded rather than smoothed over, because the
    // difference is exactly what the two guards divide between them — ownership catches every
    // cross-article case, and the still-published guard exists for the one it structurally cannot see
    // (an article retiring its OWN live slug, where owner === owner).
    it('rejects retiring a slug another article still publishes — the redirect would shadow it', () => {
      expect(() =>
        buildEditions({
          '../content/blog/one.pt.md': withRetired('one-pt', ['two-pt']),
          '../content/blog/one.en.md': plain('one-en'),
          '../content/blog/two.pt.md': plain('two-pt'),
          '../content/blog/two.en.md': plain('two-en'),
        }),
      ).toThrow(/slug "two-pt" is claimed by two different articles/);
    });

    it('rejects two articles claiming the same retired slug — one reader, two destinations', () => {
      expect(() =>
        buildEditions({
          '../content/blog/one.pt.md': withRetired('one-pt', ['shared-old']),
          '../content/blog/one.en.md': plain('one-en'),
          '../content/blog/two.pt.md': withRetired('two-pt', ['shared-old']),
          '../content/blog/two.en.md': plain('two-en'),
        }),
      ).toThrow(/slug "shared-old" is claimed by two different articles/);
    });
  });

  describe('resolution', () => {
    // Asserted against the REAL content, and deliberately without naming the replacement slug: the words
    // of a corrected slug are an editorial decision that can change again, and a test that hardcodes them
    // would have to be edited by whoever changes the title — which is how a back-compat guard gets
    // "updated" into agreeing with the break it exists to catch.
    const RETIRED = { pt: 'o-problema-parou-de-variar', en: 'the-problem-stopped-changing' } as const;

    it('resolves each published-then-corrected URL to a real, current article in its own locale', () => {
      for (const locale of ['pt', 'en'] as const) {
        const target = supersededSlugTarget(RETIRED[locale], locale);
        expect(target, `no redirect target for the retired ${locale} slug`).toBeDefined();
        expect(target).not.toBe(RETIRED[locale]);
        expect(getPostBySlug(target!, locale)).toBeDefined();
      }
    });

    it('answers undefined for a LIVE slug, so a current URL never redirects to itself', () => {
      expect(supersededSlugTarget(PT_SLUG, 'pt')).toBeUndefined();
      expect(supersededSlugTarget(EN_SLUG, 'en')).toBeUndefined();
    });

    it('answers undefined for an unknown slug, leaving the in-locale not-found intact', () => {
      expect(supersededSlugTarget('never-published', 'pt')).toBeUndefined();
    });

    // A retired slug is per-locale like a live one, so the pt one must not resolve under `en`. Without
    // this, an English reader on the retired PT address would be redirected into the Portuguese edition.
    it('does not resolve one locale’s retired slug under the other locale', () => {
      expect(supersededSlugTarget(RETIRED.pt, 'en')).toBeUndefined();
      expect(supersededSlugTarget(RETIRED.en, 'pt')).toBeUndefined();
    });

    // The UNPREFIXED entry point (#204): `/blog/<retired>` carries no locale, so `RootRedirect` maps it
    // through `articlePathForLocale`. If that mapper did not see retired slugs, a shared old link would be
    // re-prefixed verbatim onto a route that no longer exists — the dead end #204 fixed, reintroduced by a
    // slug correction instead of by a locale.
    it('maps an unprefixed retired path to the reader’s own edition, from either direction', () => {
      const ptPath = articlePathForLocale(`/blog/${RETIRED.en}`, 'pt');
      const enPath = articlePathForLocale(`/blog/${RETIRED.pt}`, 'en');
      expect(ptPath).not.toBe(`/blog/${RETIRED.en}`);
      expect(enPath).not.toBe(`/blog/${RETIRED.pt}`);
      expect(getPostBySlug(ptPath.replace('/blog/', ''), 'pt')).toBeDefined();
      expect(getPostBySlug(enPath.replace('/blog/', ''), 'en')).toBeDefined();
    });
  });
});

// #510 — THE HELD STATE, against the real glob and the committed fixture pair.
//
// This is the load-bearing block of the slice. `content.ts` is the one module where the two behaviours
// must DIVERGE: a held article leaves the public enumeration and stays resolvable. Get either half wrong
// and the feature is either pointless (the page cannot render) or absent (the article is published).
//
// ACCEPTANCE CRITERION 4 lives here in its unit form — zero appearances in the index and the feed — and
// again in `e2e/held-draft.spec.ts` against the built site, where "the navigation" can actually be read.
//
// THE MUTATION, run and recorded rather than described: flipping `draft: true` to `false` on the fixture
// pair reddens every assertion in this block that names the hold. That is the check that separates an
// assertion ABOUT the hold from one that merely happens to be true.
describe('a held article (draft: true) leaves the public enumeration and stays resolvable', () => {
  it('is absent from the index and the feed, in BOTH locales', () => {
    for (const locale of LOCALES) {
      const slugs = getAllPosts(locale).map((p) => p.slug);
      expect(slugs, `${locale}: the held fixture must not be listed`).not.toContain(HELD_SLUGS[locale]);
    }
  });

  // Guards the assertion above from passing vacuously. `not.toContain` over an EMPTY list is true, and an
  // empty list is exactly what a broken glob produces — so without this the block would go green on the
  // one failure that breaks the whole module.
  it('is absent from a list that is not empty — the corpus is the ruler', () => {
    for (const locale of LOCALES) expect(getAllPosts(locale).length).toBeGreaterThan(0);
  });

  // The held fixture is authored with `track: engenharia` and a real `tag`, so a filter that ignored the
  // hold would surface it here even though the unfiltered list does not. Asserted separately because
  // `getAllPosts` applies the filter to `byLocale` — if the exclusion ever moved into the filter instead
  // of into the source list, the unfiltered assertion above would still pass.
  it('is absent from the FILTERED lists too, not only the unfiltered one', () => {
    expect(getAllPosts('en', { track: 'engenharia' }).map((p) => p.slug)).not.toContain(HELD_SLUGS.en);
    expect(getAllPosts('en', { tag: 'harness' })).toEqual([]);
  });

  // THE OTHER HALF, and the reason the hold is not simply "delete it from the glob": the page has to
  // render for the owner reading it with the preview parameter. `getPostBySlug` resolves against the
  // edition index rather than the public list, which is the one divergence this slice introduces.
  it('is still resolvable by getPostBySlug, at its own per-locale slug', () => {
    for (const locale of LOCALES) {
      const post = getPostBySlug(HELD_SLUGS[locale], locale);
      expect(post, `${locale}: a held article must remain renderable at its final URL`).toBeDefined();
      expect(post?.draft).toBe(true);
      expect(post?.body).toContain(HELD_NONCES[locale]);
    }
  });

  // The locale toggle and hreflang go through `getEditions`, so a held article that resolved in one
  // locale and not the other would strand the owner mid-review with a dead language switch.
  it('is still resolvable by getEditions, from either locale, with both editions held', () => {
    for (const locale of LOCALES) {
      const eds = getEditions(HELD_SLUGS[locale], locale);
      expect(eds).toBeDefined();
      expect(eds?.pt.slug).toBe(HELD_SLUGS.pt);
      expect(eds?.en.slug).toBe(HELD_SLUGS.en);
      expect(eds?.pt.draft).toBe(true);
      expect(eds?.en.draft).toBe(true);
    }
  });

  it('a published article is not held — the flag distinguishes, it does not blanket', () => {
    expect(getPostBySlug(EN_SLUG, 'en')?.draft).toBe(false);
  });
});

// `draft` is a FACT (FACT_KEYS): the two editions must agree, or a held PT edition ships beside a
// published EN one — half an article published, which is the precise failure the unpublishable contract
// exists to make impossible. Exercised through `buildEditions` with synthetic input, because the real
// corpus always agrees and could therefore never reach the throw.
describe('draft is a shared fact, not per-locale prose', () => {
  const fm = (draft: string) =>
    `---\nslug: demo\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\ndraft: ${draft}\n---\nbody`;

  it('throws when one edition is held and the other is not', () => {
    expect(() =>
      buildEditions({ '../content/blog/demo.pt.md': fm('true'), '../content/blog/demo.en.md': fm('false') }),
    ).toThrow(/disagrees on the fact "draft"/);
  });

  it('accepts a pair that agrees, in either direction', () => {
    expect(
      buildEditions({ '../content/blog/d.pt.md': fm('true'), '../content/blog/d.en.md': fm('true') }).d.en.draft,
    ).toBe(true);
    expect(
      buildEditions({ '../content/blog/d.pt.md': fm('false'), '../content/blog/d.en.md': fm('false') }).d.en.draft,
    ).toBe(false);
  });

  // `=== true`, not truthy. `draft: "false"` is a YAML STRING and therefore truthy, and an author who
  // quotes the value must not silently hold a finished article. The absent case matters more still: every
  // article written before this field existed carries no `draft:` line at all, and reading that as held
  // would un-publish the whole site in one commit.
  it('reads only a real boolean true as held — a quoted "false", and an absent flag, publish', () => {
    const noFlag = `---\nslug: demo\ntitle: T\ndate: '2026-01-01T00:00:00.000Z'\ntag: aws\ntrack: engenharia\n---\nbody`;
    expect(
      buildEditions({ '../content/blog/d.pt.md': fm('"false"'), '../content/blog/d.en.md': fm('"false"') }).d.en.draft,
    ).toBe(false);
    expect(
      buildEditions({ '../content/blog/d.pt.md': noFlag, '../content/blog/d.en.md': noFlag }).d.en.draft,
    ).toBe(false);
  });
});
