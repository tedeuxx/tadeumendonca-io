import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { contentFiles } from './diagram-source.mjs';
import { markdownFilesIn } from './video-thumbs.mjs';

// #741 — WHICH READERS SEE A PENDING REVISION, and which must not.
//
// A revision lives in `src/content/revisions/`, a SIBLING of `blog/`. The design rests on two properties,
// and this file pins both:
//
//  1. THE FOUR ENUMERATING READERS READ `blog/` AND ONLY `blog/`. Routes and the sitemap (`routes.mjs`),
//     the OG cards (`gen-og-articles.mjs` via `og-cards.mjs`), and the social kit (`gen-distribution.mjs`)
//     must never enumerate a revision as an article. Their content directory is a module-private constant
//     (none is exported, and #741 changes none of these files), so the pin is on that constant's source.
//     A source pin is the weaker kind of assertion and is used because the stronger one would need these
//     modules edited to export a path, which is the change this slice is specified NOT to make.
//
//  2. THE RECURSIVE WALKERS DO SEE IT, and must: a revision that edits a mermaid fence needs its SVG
//     compiled (`diagramSvg` throws on an uncompiled fence) and one that embeds a video needs its poster.
//     Asserted behaviourally, over a committed fixture tree shaped like `src/content/`.

const root = resolve(import.meta.dirname, '..');
const source = (file) => readFileSync(join(root, file), 'utf8');

describe('the enumerating readers read src/content/blog, flat', () => {
  // [file, the exact declaration of the directory it enumerates]
  const readers = [
    ['scripts/routes.mjs', "const contentDir = join(root, 'src', 'content', 'blog');"],
    ['scripts/gen-distribution.mjs', "const contentDir = join(fedRoot, 'src', 'content', 'blog');"],
    ['scripts/gen-og-articles.mjs', "const blogDir = join(root, 'src', 'content', 'blog');"],
  ];

  it.each(readers)('%s enumerates blog/', (file, declaration) => {
    expect(source(file)).toContain(declaration);
  });

  // Flat is the other half: a recursive walk from `blog/` would not reach `revisions/` today, but a
  // reader made recursive from `src/content` would — and that is the shape the two walkers below have.
  // Scoped to `readdirSync`: two of these files create their OUTPUT directory with
  // `mkdirSync(…, { recursive: true })`, which reads nothing.
  it.each(readers)('%s does not walk recursively', (file) => {
    expect(source(file)).toMatch(/readdirSync\(/);
    expect(source(file)).not.toMatch(/readdirSync\([^)]*recursive/);
  });

  it('og-cards.mjs lists its directory flat', () => {
    expect(source('scripts/og-cards.mjs')).toContain('articleKeysFrom(readdirSync(blogDir),');
  });

  // The app's own enumeration: the blog glob is non-recursive, and the revisions glob is a separate one.
  it('content.ts globs blog/ and revisions/ separately, each one level deep', () => {
    const ts = source('src/lib/content.ts');
    expect(ts).toContain("import.meta.glob('../content/blog/*.{pt,en}.md'");
    expect(ts).toContain("import.meta.glob('../content/revisions/*.{pt,en}.md'");
  });
});

describe('the recursive walkers DO include a revision', () => {
  const fixture = join(root, 'scripts', '__fixtures__', 'content-with-revision');
  const listed = (files) => files.map((f) => relative(fixture, f)).sort();

  it('contentFiles() (diagrams) lists the revision beside the published edition', () => {
    expect(listed(contentFiles(fixture))).toEqual([join('blog', 'fixture.en.md'), join('revisions', 'fixture.en.md')]);
  });

  it('markdownFilesIn() (video posters) lists the revision beside the published edition', () => {
    expect(listed(markdownFilesIn(fixture))).toEqual([
      join('blog', 'fixture.en.md'),
      join('revisions', 'fixture.en.md'),
    ]);
  });
});
