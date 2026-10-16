import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { split, slugOf, unlink, proseLines, onlyIn, readRevisions, CONTENT_DIR } from './revision-lines.mjs';

// #741 — the derivation `e2e/revision-preview.spec.ts` runs on. If it picked the wrong line, the spec
// would assert on text both versions share (green for the wrong reason) or on markup a browser never
// renders (red for the wrong reason).

describe('split / slugOf', () => {
  it('separates the frontmatter block from the trimmed body', () => {
    expect(split('---\nslug: a\n---\n\nBody.\n')).toEqual({ fm: 'slug: a', body: 'Body.' });
    expect(split('No frontmatter.')).toEqual({ fm: '', body: 'No frontmatter.' });
  });

  it('reads the slug, quoted or not, and falls back to the key', () => {
    expect(slugOf('title: T\nslug: my-slug', 'k')).toBe('my-slug');
    expect(slugOf('slug: "quoted"', 'k')).toBe('quoted');
    expect(slugOf('title: T', 'the-key')).toBe('the-key');
    expect(slugOf("slug: 'single'  ", 'k')).toBe('single');
    expect(slugOf('slug: bad"quote', 'the-key')).toBe('the-key');
    // An empty value falls back to the key, as `content.ts` does; it never reads the NEXT line as the slug.
    expect(slugOf('slug:\ndate: 2026-01-01', 'the-key')).toBe('the-key');
    expect(slugOf('aslug: no', 'the-key')).toBe('the-key');
  });
});

describe('proseLines — what a reader sees', () => {
  it('strips links, emphasis, code ticks and block markers', () => {
    expect(proseLines('## A heading long enough\n- a **bold** [link](/x) and `code` item')).toEqual([
      'A heading long enough',
      'a bold link and code item',
    ]);
  });

  it('unlinks images and links, and leaves an unclosed bracket as written', () => {
    expect(unlink('see ![alt text](/a.png) and [a link](https://x.y/z) here')).toBe('see alt text and a link here');
    expect(unlink('a [bracket] (not a link) and [open only')).toBe('a [bracket] (not a link) and [open only');
    expect(unlink('[x](no close and [y]')).toBe('[x](no close and [y]');
    expect(unlink('[a](b [c](d)')).toBe('a');
    expect(unlink('wow! [x](y)')).toBe('wow! x');
    expect(unlink('a [note] then [a link](x)')).toBe('a [note] then a link');
  });

  it('drops fenced blocks, tables, raw HTML and short lines', () => {
    const body = '```mermaid\nflowchart TB long enough line\n```\n| a | table row long |\n<div>html html</div>\nshort\n';
    expect(proseLines(body)).toEqual([]);
  });
});

describe('onlyIn — the line that tells two bodies apart', () => {
  it('returns the first line present in a and absent from b', () => {
    const published = 'The first paragraph stays.\n\nThe second paragraph stays.';
    const revised = 'The first paragraph stays.\n\nA corrected second paragraph.';
    expect(onlyIn(revised, published)).toBe('A corrected second paragraph.');
    expect(onlyIn(published, revised)).toBe('The second paragraph stays.');
  });

  // An addendum-only revision has no published-only line; the spec must then skip that half, not invent one.
  it('returns undefined when every line of a is also in b', () => {
    expect(onlyIn('Shared line of text.', 'Shared line of text.\n\nAn addendum line.')).toBeUndefined();
  });

  it('trims the probe to 60 characters', () => {
    const long = 'x'.repeat(100);
    expect(onlyIn(long, 'Other text here.')).toBe('x'.repeat(60));
  });
});

describe('readRevisions', () => {
  it('reads the real content root, and answers [] while no revision is pending', () => {
    expect(CONTENT_DIR).toBe(resolve(import.meta.dirname, '..', 'src', 'content'));
    expect(Array.isArray(readRevisions())).toBe(true);
  });

  it('answers [] for a content root with no revisions/ directory', () => {
    expect(readRevisions(join(import.meta.dirname, '__fixtures__', 'plugin'))).toEqual([]);
  });

  it('derives slug and both distinguishing lines per locale from a pair on disk', () => {
    const [rev, ...rest] = readRevisions(join(import.meta.dirname, '__fixtures__', 'revision-pair'));
    expect(rest).toEqual([]);
    expect(rev.key).toBe('fixture');
    expect(rev.slug).toEqual({ en: 'fixture', pt: 'fixture-pt' });
    expect(rev.revisionOnly).toEqual({ en: 'The corrected English sentence.', pt: 'A frase corrigida em português.' });
    expect(rev.publishedOnly).toEqual({ en: 'The original English sentence.', pt: 'A frase original em português.' });
  });
});
