import { describe, it, expect } from 'vitest';
import { getAllPosts, getPostBySlug, buildEditions, type BlogPost } from './content';

const SLUG = 'meu-compromisso';

// Extract the ordered list of markdown links from a body, for the cross-locale parity assertion.
const linksOf = (body: string) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
// Count the `##` sections — the article's structural skeleton must be identical across editions.
const sectionsOf = (body: string) => (body.match(/^##\s/gm) ?? []).length;

// Exercises the real glob + frontmatter parse against the seeded markdown in content/blog.
describe('content (markdown-in-repo, per-locale)', () => {
  it('loads the seeded post in each locale with its own prose', () => {
    const en = getPostBySlug(SLUG, 'en');
    const pt = getPostBySlug(SLUG, 'pt');
    expect(en).toBeDefined();
    expect(pt).toBeDefined();
    expect(en?.title).toBe('My Commitment');
    expect(pt?.title).toBe('Meu Compromisso');
    expect(en?.body).toContain('The commitment');
    expect(pt?.body).toContain('O compromisso');
    expect(en?.body).not.toContain('---'); // frontmatter fence stripped
  });

  it('shares facts across the two editions (authored once, cannot disagree)', () => {
    const en = getPostBySlug(SLUG, 'en')!;
    const pt = getPostBySlug(SLUG, 'pt')!;
    expect(en.slug).toBe(pt.slug);
    expect(en.date).toBe('2026-07-26T22:00:00.000Z'); // stayed a string (not a YAML Date)
    expect(en.date).toBe(pt.date);
    expect(en.tag).toBe(pt.tag);
    expect(en.track).toBe(pt.track);
  });

  it('keeps each edition free of the other locale prose (no leak)', () => {
    const en = getPostBySlug(SLUG, 'en')!;
    const pt = getPostBySlug(SLUG, 'pt')!;
    expect(en.body).not.toContain('O compromisso');
    expect(pt.body).not.toContain('The commitment');
    expect(en.title).not.toContain('Compromisso');
    expect(pt.title).not.toContain('Commitment');
  });

  it('has the same links in the same order, and the same section count, across locales', () => {
    const en = getPostBySlug(SLUG, 'en')!;
    const pt = getPostBySlug(SLUG, 'pt')!;
    expect(linksOf(en.body)).toEqual(linksOf(pt.body));
    expect(sectionsOf(en.body)).toBe(sectionsOf(pt.body));
    expect(sectionsOf(en.body)).toBeGreaterThan(0);
  });

  it('parses the track and the reader-first takeaway', () => {
    const post = getPostBySlug(SLUG, 'en')!;
    expect(post.track).toBe('engenharia');
    expect(post.takeaway).toBeTruthy();
  });

  it('defaults the optional fields conservatively', () => {
    const post = getPostBySlug(SLUG, 'en')!;
    expect(post.hasVideo).toBe(false); // an absent flag is never truthy
    expect(post.linkedinUrl).toBeUndefined();
    expect(post.cover).toBeUndefined();
  });

  it('returns undefined for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist', 'en')).toBeUndefined();
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
    `---\nslug: demo\ntitle: ${over.title ?? 'T'}\ndate: '2026-01-01T00:00:00.000Z'\ntag: ${over.tag ?? 'aws'}\ntrack: engenharia\n---\nbody`;

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
  const post: BlogPost | undefined = getPostBySlug(SLUG, 'en');
  expect(typeof post?.body).toBe('string');
});
