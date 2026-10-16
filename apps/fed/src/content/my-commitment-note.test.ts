// `my-commitment` as a dated record that opens on an update note (#688).
//
// WHY THIS EXISTS. The first post, published 2026-07-26, describes a mission that has since changed its
// centre. The owner ruled the article stays as written and opens on a dated note instead of a rewrite, and
// that the note ships separately, as a pending revision he reads under `?preview` before release (#688,
// "Separar a nota"). This pins the SOURCE; the served bytes are pinned by
// `e2e/my-commitment-note.spec.ts`.
//
// TWO STATES, ONE FILE. The note ships as a PENDING REVISION (#741, ADR-0049 as amended 2026-10-16):
// merge 1 adds `revisions/my-commitment.{en,pt}.md`, merge 2 moves them onto `blog/` with `git mv -f` and
// nothing else. So the text under test is the revision while one exists for this key, and the published
// edition otherwise; each state adds the arms only it can hold. Neither needs an edit at release, which is
// what keeps the release one commit.
//
// WHAT THIS CANNOT DO. The note's arms are PHRASE CHECKS: a paraphrase passes. That the note is the text
// approved on PR #743 needs git history, which a unit test does not read; it is checked by comparing the
// revision files with `git show 095a15f:<blog file>`.
import { describe, it, expect } from 'vitest';
import en from './blog/my-commitment.en.md?raw';
import pt from './blog/my-commitment.pt.md?raw';

const revisions = import.meta.glob('./revisions/my-commitment.*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
// The state is read off the tree, never typed: a revision file for this key means merge 1 has landed and
// merge 2 has not.
const PENDING = Object.keys(revisions).length > 0;
const PUBLISHED = { en, pt } as const;
const BODY = PENDING
  ? {
      en: revisions['./revisions/my-commitment.en.md'] ?? '',
      pt: revisions['./revisions/my-commitment.pt.md'] ?? '',
    }
  : PUBLISHED;
const LOCALES = ['en', 'pt'] as const;

const NOTE_OPEN = { en: '> **Update, 16 October 2026.**', pt: '> **Atualização, 16 de outubro de 2026.**' };
const NOTE_CLOSE = { en: '> What follows is where I started.', pt: '> O que vem abaixo é de onde eu parti.' };
// The original's first paragraph, which the note must sit directly above.
const FIRST_PARAGRAPH = {
  en: "I'm a software engineer in the middle of a transition",
  pt: 'Sou engenheiro de software no meio de uma transição',
};
// The dates the note is allowed to carry; every other digit would be a count.
const DATES = {
  en: ['16 October 2026', '26 July 2026'],
  pt: ['16 de outubro de 2026', '26 de julho de 2026'],
};

const FRONTMATTER_END = '\n---\n';
const bodyStart = (text: string): number => text.indexOf(FRONTMATTER_END, 4) + FRONTMATTER_END.length;
const note = (locale: (typeof LOCALES)[number]): string => {
  const text = BODY[locale];
  const at = text.indexOf(NOTE_OPEN[locale]);
  const end = text.indexOf(NOTE_CLOSE[locale]);
  return at < 0 || end < 0 ? '' : text.slice(at, end + NOTE_CLOSE[locale].length);
};

describe('a dated note opens each edition (#688)', () => {
  it.each(LOCALES)('the %s note is the first thing after the frontmatter, one blank line above the original', (locale) => {
    const text = BODY[locale];
    const start = bodyStart(text);
    expect(start, `${locale}: no frontmatter`).toBeGreaterThan(FRONTMATTER_END.length);
    expect(text.slice(start).startsWith(NOTE_OPEN[locale]), `${locale}: the note does not open the body`).toBe(true);
    expect(
      text.includes(`${NOTE_CLOSE[locale]}\n\n${FIRST_PARAGRAPH[locale]}`),
      `${locale}: the note does not sit one blank line above the original's first paragraph`,
    ).toBe(true);
  });

  it.each(LOCALES)('the %s note is one blockquote, and appears once', (locale) => {
    const text = note(locale);
    expect(text.length, `${locale}: note missing`).toBeGreaterThan(500);
    for (const line of text.split('\n')) expect(line.startsWith('>'), `${locale}: "${line}" is outside the quote`).toBe(true);
    expect(BODY[locale].split(NOTE_OPEN[locale]).length - 1).toBe(1);
  });

  it.each(LOCALES)('the %s note publishes no number other than its dates', (locale) => {
    let text = note(locale);
    expect(text.length, `${locale}: note missing`).toBeGreaterThan(500);
    for (const d of DATES[locale]) text = text.split(d).join('');
    expect(text).not.toMatch(/\d/);
  });
});

// While the revision is pending (merge 1 landed, merge 2 not): the published edition is the one every
// visitor reads, so it must be untouched, and the revision must be that edition plus the note only.
describe.runIf(PENDING)('while the revision is pending, the published edition is untouched (#688)', () => {
  it.each(LOCALES)('the published %s edition carries no note and opens on the original', (locale) => {
    expect(PUBLISHED[locale]).not.toContain(NOTE_OPEN[locale]);
    const text = PUBLISHED[locale];
    expect(text.slice(bodyStart(text)).startsWith(FIRST_PARAGRAPH[locale])).toBe(true);
  });

  it.each(LOCALES)('the %s revision is the published edition with only the note inserted', (locale) => {
    const revised = BODY[locale];
    const start = bodyStart(revised);
    const block = note(locale);
    expect(revised.slice(start, start + block.length)).toBe(block);
    const rest = revised.slice(start + block.length);
    expect(rest.startsWith('\n\n')).toBe(true);
    expect(revised.slice(0, start) + rest.slice(2)).toBe(PUBLISHED[locale]);
  });
});
// Once released, the arms above read the published edition. "No revision is left for this key" is a
// `git ls-tree` check at merge 2: asserted here it would be the state predicate restated, true by
// construction.
