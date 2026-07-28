import { describe, it, expect } from 'vitest';
import {
  getAllPosts,
  getPostBySlug,
  getEditions,
  alternateSlug,
  localizeArticlePath,
  articlePathForLocale,
  buildEditions,
  type BlogPost,
} from './content';

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
