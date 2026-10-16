import { describe, it, expect } from 'vitest';
import { buildEditions, buildRevisions, revisionFor, getRevision, getPostBySlug } from './content';

// #741 — pending revisions of published articles. Fed SYNTHETIC sets: the real `revisions/` directory is
// empty whenever no correction is pending, so the real glob exercises none of the refusals below.
//
// Each refusal test is paired with the accepting case it differs from by ONE thing, so a refusal that fired
// for the wrong reason (an earlier guard) would turn the control red rather than pass silently.

const fm = (slug: string, title: string, extra = '') =>
  `---\nslug: ${slug}\ntitle: ${title}\ndate: "2026-07-01T00:00:00Z"\ntag: ai\n${extra}---\n`;

const PUBLISHED = {
  '../content/blog/fixed.en.md': `${fm('fixed', 'Fixed')}\nThe published English body.\n`,
  '../content/blog/fixed.pt.md': `${fm('corrigido', 'Corrigido')}\nO corpo publicado em português.\n`,
  '../content/blog/held.en.md': `${fm('held', 'Held', 'draft: true\n')}\nHeld body.\n`,
  '../content/blog/held.pt.md': `${fm('retido', 'Retido', 'draft: true\n')}\nCorpo retido.\n`,
};
const editions = buildEditions(PUBLISHED);

const revisionOf = (key: string, locale: 'en' | 'pt', body: string) => ({
  [`../content/revisions/${key}.${locale}.md`]: `${PUBLISHED[`../content/blog/${key}.${locale}.md` as keyof typeof PUBLISHED]
    .split('\n---\n')[0]}\n---\n\n${body}\n`,
});

const VALID = {
  ...revisionOf('fixed', 'en', 'The CORRECTED English body.'),
  ...revisionOf('fixed', 'pt', 'O corpo CORRIGIDO em português.'),
};

const build = (revisions: Record<string, string>) => buildRevisions(revisions, PUBLISHED, editions);

describe('buildRevisions — the accepting case every refusal is measured against', () => {
  it('accepts a full pair on a published article, replacing ONLY the body', () => {
    const revised = build(VALID);
    expect(revised.fixed.en.body).toBe('The CORRECTED English body.');
    expect(revised.fixed.pt.body).toBe('O corpo CORRIGIDO em português.');
    // Everything else is the published edition's own — slug, title, the derived card path.
    expect({ ...revised.fixed.en, body: '' }).toEqual({ ...editions.fixed.en, body: '' });
    expect(revised.fixed.pt.slug).toBe('corrigido');
  });

  it('builds nothing from an empty directory — the steady state', () => {
    expect(build({})).toEqual({});
  });
});

describe('buildRevisions — the five refusals', () => {
  it('1 · refuses an ORPHAN: a revision whose key names no article', () => {
    const orphan = {
      '../content/revisions/renamed.en.md': VALID['../content/revisions/fixed.en.md'],
      '../content/revisions/renamed.pt.md': VALID['../content/revisions/fixed.pt.md'],
    };
    expect(() => build(orphan)).toThrow(/revision "renamed" names no published article/);
  });

  it('2 · refuses a HALF PAIR', () => {
    const half = revisionOf('fixed', 'en', 'Only English was corrected.');
    expect(() => build(half)).toThrow(/revision "fixed" is missing the pt edition/);
  });

  it('3 · refuses a revision on a HELD article', () => {
    const onHeld = { ...revisionOf('held', 'en', 'Changed held.'), ...revisionOf('held', 'pt', 'Mudado retido.') };
    expect(() => build(onHeld)).toThrow(/revision "held" targets a HELD article/);
  });

  it('4 · refuses frontmatter that is not BYTE-equal — even when it parses to the same values', () => {
    // Same keys, same values, one extra space: a parsed-value comparison would accept it; the lock is on bytes.
    const drift = {
      ...VALID,
      '../content/revisions/fixed.en.md': VALID['../content/revisions/fixed.en.md'].replace('tag: ai', 'tag:  ai'),
    };
    expect(() => build(drift)).toThrow(/revision "fixed" \(en\) has frontmatter that differs/);
  });

  it('4 · refuses a changed title', () => {
    const retitled = {
      ...VALID,
      '../content/revisions/fixed.pt.md': VALID['../content/revisions/fixed.pt.md'].replace(
        'title: Corrigido',
        'title: Outro',
      ),
    };
    expect(() => build(retitled)).toThrow(/revision "fixed" \(pt\) has frontmatter that differs/);
  });

  it('5 · refuses a body EQUAL to the published one — a leftover after a release by copy', () => {
    const leftover = { ...VALID, ...revisionOf('fixed', 'pt', 'O corpo publicado em português.') };
    expect(() => build(leftover)).toThrow(/revision "fixed" \(pt\) has the same body as the published edition/);
  });

  it('refuses a filename that is not <key>.<locale>.md, and a locale outside LOCALES', () => {
    expect(() => build({ '../content/revisions/fixed.md': 'x' })).toThrow(/unexpected revision filename/);
    expect(() => build({ '../content/revisions/fixed.de.md': 'x' })).toThrow(/locale "de"/);
  });
});

describe('revisionFor / getRevision — which revision a URL resolves to', () => {
  const revisions = build(VALID);

  it('resolves the CURRENT slug in each locale to that locale’s revision', () => {
    expect(revisionFor('fixed', 'en', editions, revisions)?.body).toBe('The CORRECTED English body.');
    expect(revisionFor('corrigido', 'pt', editions, revisions)?.body).toBe('O corpo CORRIGIDO em português.');
  });

  it('returns undefined for an unknown slug, a wrong-locale slug, and an article with no revision', () => {
    expect(revisionFor('nope', 'en', editions, revisions)).toBeUndefined();
    expect(revisionFor('corrigido', 'en', editions, revisions)).toBeUndefined();
    expect(revisionFor('held', 'en', editions, revisions)).toBeUndefined();
  });

  it('returns undefined for a RETIRED slug — the redirect to the current slug happens before the page', () => {
    const moved = buildEditions({
      '../content/blog/fixed.en.md': PUBLISHED['../content/blog/fixed.en.md'].replace(
        'slug: fixed\n',
        'slug: fixed\npreviousSlugs: old-fixed\n',
      ),
      '../content/blog/fixed.pt.md': PUBLISHED['../content/blog/fixed.pt.md'],
    });
    expect(revisionFor('fixed', 'en', moved, revisions)).toBeDefined();
    expect(revisionFor('old-fixed', 'en', moved, revisions)).toBeUndefined();
  });

  // The real binding, against the real (empty) directory: a real published article has no revision.
  it('getRevision answers undefined for a real published article while no revision is pending', () => {
    expect(getPostBySlug('my-commitment', 'en')).toBeDefined();
    expect(getRevision('my-commitment', 'en')).toBeUndefined();
  });
});
