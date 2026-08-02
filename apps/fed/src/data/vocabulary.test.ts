import { describe, it, expect } from 'vitest';
import { STACK } from '../components/Marquee';
// `?raw` rather than `node:fs`, and the first version got this wrong in a way vitest could not see:
// the app's tsconfig carries no Node types, so `readFileSync`/`__dirname` typecheck-fail while the
// suite passes — vitest does not run tsc. Green tests, red build, pushed. `?raw` is Vite's own way to
// import a file as text, it is already the idiom here (`content/architecture-links.test.ts`), and it
// needs no types the app does not have.
import profileSrc from './profile.ts?raw';
import architectureEn from '../content/architecture.en.md?raw';
import architecturePt from '../content/architecture.pt.md?raw';

// THE PRACTICE'S NAME, PINNED ON EVERY SURFACE THAT CARRIES IT — not just the OG card.
//
// This file exists because of an asymmetry that was the MECHANISM of a real miss rather than a
// symptom of one. The term has been renamed twice in three days, and both times the only assertion
// guarding it in this repo was on `META_LINE` — so `profile.ts`, the landing strip and both editions
// of `/architecture` carried the term with nothing watching. An edit reverting the CV to a superseded
// name would ship with a fully green build.
//
// The sibling repo learned this first: `-skills` was left on a retired term for a day in July because
// it was outside the batch, and its answer was a suite looping the same both-directions check over
// every document that names the practice. This is that shape, here, over the surfaces this repo owns.
//
// WHY BOTH DIRECTIONS. Presence alone passes on a document that gains the new name and keeps the old
// one three paragraphs down — which is exactly what "supersede, never rewrite" makes easy to do by
// accident in prose files that legitimately discuss their own history.
//
// WHY A LOOKBEHIND AND A STEM. Two lessons paid for in full elsewhere in this batch:
//   · the term GREW (`Harness` → `Agent Harness`), so `toContain('Harness Engineering')` is satisfied
//     by the qualified form and stops discriminating — silently, on the day of the rename;
//   · the term also INFLECTED (`Loop Engineering` → the role noun `Loop Engineer`), so a fixed-string
//     check for the retired term missed a heading that still named its practitioner.
// A fixed-string comparison guarding a NAME breaks the day the name changes shape. Both are patterns.
const CURRENT = 'Agent Harness Engineering';
const BARE_UNPREFIXED = /(?<!Agent )Harness Engineering/;
const RETIRED_STEM = /Loop Engineer/;

// Surfaces are read as SOURCE rather than imported as values, because what is asserted is the
// authored TEXT — including the comments around it, which is where a superseded term most often
// survives a find-and-replace. `profile.ts` is read the same way for the same reason: its comments
// carry the vocabulary history and are exactly where the bare form would linger.
const SURFACES: ReadonlyArray<[string, string]> = [
  ['profile.ts', profileSrc],
  ['architecture.en.md', architectureEn],
  ['architecture.pt.md', architecturePt],
];

describe('the practice is named consistently across every surface', () => {
  it.each(SURFACES)('%s names the current term', (_name, src) => {
    expect(src).toContain(CURRENT);
  });

  it.each(SURFACES)('%s carries no un-prefixed form of it', (_name, src) => {
    // Historical notes are allowed to NAME the supersession — what is forbidden is the bare form
    // standing as the practice's name. The lookbehind draws exactly that line: `Agent Harness
    // Engineering` passes, a lone `Harness Engineering` does not, wherever it sits.
    expect(src).not.toMatch(BARE_UNPREFIXED);
  });

  it.each(SURFACES)('%s is clear of the retired term in every inflection', (_name, src) => {
    expect(src).not.toMatch(RETIRED_STEM);
  });

  // The strip is asserted through the exported list rather than the file, because here the DATA is
  // the surface — a reader sees the array's contents, not its source.
  it('the landing strip carries the current term and no superseded form', () => {
    expect(STACK).toContain(CURRENT);
    expect(STACK.filter((s) => BARE_UNPREFIXED.test(s))).toEqual([]);
    expect(STACK.filter((s) => RETIRED_STEM.test(s))).toEqual([]);
  });
});
