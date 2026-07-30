import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { collectFences, mermaidFences, normalise, hashOf, diffAgainstArtifact } from './diagram-source.mjs';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const artifact = JSON.parse(readFileSync(join(contentDir, 'generated', 'diagrams.json'), 'utf8'));
const fences = collectFences(contentDir);

// The rendered half of the SVG.
//
// mermaid emits boilerplate into every diagram: CSS rules for shapes this one does not use, and <defs>
// nothing references. Asserting the palette over the whole string would fail on CORRECT output, which is
// how a rule gets weakened until it says nothing.
//
// But the first version of this dropped the entire <style> block, and that was too generous in exactly
// the way the caller feared: `#F5F4EF` — the fill of EVERY node box — is declared only there, so the
// assertion named "uses only the palette" could not see the primary fill. Regressing it to magenta left
// the test green. Caught by the critical-reviewer; the fix is to drop only the two selector families
// that are genuinely dead here, and keep the rules that decide what a reader sees.
//
// Dead by inspection, not by assumption: the markup renders `data-look="classic"`, so every
// `[data-look="neo"]` rule is unreachable, and there is no KaTeX in a flowchart.
const DEAD_SELECTORS = /[^{}]*(?:\[data-look=|\.katex)[^{}]*\{[^}]*\}/g;
const rendered = (svg) =>
  svg.replace(/<style[\s\S]*?<\/style>/g, (block) => block.replace(DEAD_SELECTORS, '')).replace(/<defs[\s\S]*?<\/defs>/g, '');

describe('mermaid source extraction', () => {
  it('finds a fence and ignores an indented one inside another code block', () => {
    const md = ['```mermaid', 'flowchart LR', '  A --> B', '```', '', 'Prose.', '', '    ```mermaid', '    not a diagram', '    ```'].join('\n');
    const found = mermaidFences(md);
    expect(found).toHaveLength(1);
    expect(found[0].source).toContain('flowchart LR');
  });

  // Normalisation decides what counts as "the same diagram". Without it, re-indenting a fence or a CRLF
  // checkout invalidates the committed artifact and fails the build for a whitespace edit — and a guard
  // that cries wolf is a guard someone turns off.
  it('treats trailing whitespace, CRLF and outer padding as noise, and interior structure as signal', () => {
    expect(normalise('flowchart LR  \r\n  A --> B\t\n\n')).toBe('flowchart LR\n  A --> B');
    expect(hashOf('flowchart LR\nA --> B')).toBe(hashOf('  flowchart LR\nA --> B  \n'));
    expect(hashOf('flowchart LR\nA --> B')).not.toBe(hashOf('flowchart LR\nA --> C'));
  });
});

// THE STALENESS GATE. It runs here, in Node, and not at module load in the browser: recomputing hashes
// on the client would ship a sha256 into the bundle and run it on every page load to catch a mistake
// only makeable in this repo. Both directions are checked, for different reasons — `missing` means a
// diagram was edited without regenerating, and a STALE picture is worse than an absent one because a
// picture reads as current in a way prose does not; `orphaned` never breaks anything, which is exactly
// why nobody would notice the artifact accumulating dead SVGs.
describe('the committed artifact matches the authored sources', () => {
  it('has an entry for every fence, and no entry that is not a fence', () => {
    const { missing, orphaned } = diffAgainstArtifact(fences, artifact);
    expect(
      missing.map((f) => relative(root, f.file)),
      'edited without regenerating — run `npm run gen-diagrams`',
    ).toEqual([]);
    expect(orphaned, 'dead diagrams left in diagrams.json — run `npm run gen-diagrams`').toEqual([]);
  });

  it('compiled something at all — an empty artifact must not pass as "in sync"', () => {
    expect(fences.length).toBeGreaterThan(0);
    expect(Object.keys(artifact).length).toBe(fences.length);
  });
});

describe('every compiled diagram is in the site’s visual language and carries no live surface', () => {
  const entries = Object.entries(artifact);

  it.each(entries.map(([, svg], i) => [i, svg]))('diagram %i uses only the palette', (_i, svg) => {
    const used = [...new Set([...rendered(svg).matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0].toUpperCase()))];
    // Near-black, off-white, and the one accent (ADR-0008). A default mermaid theme fails on the first.
    expect(used.filter((c) => !['#0A0A0A', '#F5F4EF', '#FF5A00'].includes(c))).toEqual([]);
    // POSITIVE too, not only negative. "No forbidden colour" is satisfied by a diagram that lost the
    // colour entirely — including by this very filter over-stripping again. Both palette members that
    // actually appear must still be there.
    expect(used).toEqual(expect.arrayContaining(['#0A0A0A', '#F5F4EF']));
  });

  it.each(entries.map(([, svg], i) => [i, svg]))('diagram %i has square corners and no depth', (_i, svg) => {
    const r = [...rendered(svg).matchAll(/\br[xy]="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(r.filter((n) => n > 0)).toEqual([]);
    // The defs exist in every mermaid output; what must not exist is anything USING them.
    expect(rendered(svg)).not.toMatch(/(filter|fill|stroke)="url\(/);
  });

  // The justification for dangerouslySetInnerHTML is that this string is build-generated and in-repo.
  // That is a claim about provenance, so the content is checked rather than trusted.
  it.each(entries.map(([, svg], i) => [i, svg]))('diagram %i carries no script, handler or foreignObject', (_i, svg) => {
    expect(svg).not.toContain('<script');
    expect(svg).not.toMatch(/\son[a-z]+="/);
    // htmlLabels:false. If this regresses, labels become HTML inside <foreignObject> — invisible to a
    // crawler reading the SVG and unreadable as text, which is the reason inline SVG was chosen at all.
    expect(svg).not.toContain('<foreignObject');
  });

  it.each(entries.map(([, svg], i) => [i, svg]))('diagram %i renders its labels as real text', (_i, svg) => {
    expect(svg.match(/<text/g)?.length ?? 0).toBeGreaterThan(3);
  });

  it.each(entries.map(([, svg], i) => [i, svg]))('diagram %i declares a viewBox, so it can actually size', (_i, svg) => {
    expect(svg).toMatch(/viewBox="[-\d. ]+"/);
  });
});
