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

// THE PARENTHESISED FORM IS A PROSE AFFORDANCE, AND IT IS SCOPED TO THE SURFACES THAT EARNED IT.
// `/architecture` opens by naming the practice as `(Agent) Harness Engineering` — the parentheses are
// doing work there: the essay is about what the word `Agent` adds, so the sentence has to be able to
// show the term with and without it. That is an argument about the essay, not about the vocabulary.
//
// WHY THIS IS NOT A RELAXATION OF `BARE_UNPREFIXED`. Widening the shared pattern would silently permit
// `(Agent) Harness Engineering` in the CV headline (`profile.ts`) and on the landing strip — the very
// surfaces #328 paid to pin to exactly ONE rendering, because a recruiter reading the headline meets
// the term once and a parenthetical there reads as hedging. An allowlist that covers every surface
// stops guarding the string it was built to guard. So the exception is DATA on the surface that gets
// it, and a surface not listed with it keeps the strict form by construction.
const BARE_ALLOWING_PARENTHESISED = /(?<!Agent |\(Agent\) )Harness Engineering/;

// Surfaces are read as SOURCE rather than imported as values, because what is asserted is the
// authored TEXT — including the comments around it, which is where a superseded term most often
// survives a find-and-replace. `profile.ts` is read the same way for the same reason: its comments
// carry the vocabulary history and are exactly where the bare form would linger.
//
// The third element is the surface's OWN bare-form pattern. It is a tuple rather than a flag so that
// reading the list answers "which rendering is legal here" per row, with no default to look up.
const SURFACES: ReadonlyArray<[string, string, RegExp]> = [
  ['profile.ts', profileSrc, BARE_UNPREFIXED],
  ['architecture.en.md', architectureEn, BARE_ALLOWING_PARENTHESISED],
  ['architecture.pt.md', architecturePt, BARE_ALLOWING_PARENTHESISED],
];

// THE ONE SENTENCE ON THOSE TWO SURFACES THAT STILL MAY NOT PARENTHESISE, AND WHY IT IS PINNED APART.
// The affordance above is granted per FILE, so it necessarily covers the closing paragraph too — and
// that paragraph is where the essay stops describing the term and CLAIMS it: "Agent Harness
// Engineering is the claim I am making". A parenthesis there makes optional the very word the sentence
// is claiming, so the unqualified rendering is not a stylistic leftover; it is the point of the
// sentence. The `toContain(CURRENT)` assertion does not cover this — `accDescr` further up carries a
// plain occurrence, so a drift confined to the claim sentence would ship green.
//
// ANCHORED ON THE CLAUSE, NOT ON A LINE NUMBER: this page is being restructured (#448), and a
// positional anchor would silently start guarding a different sentence. The clause is distinctive per
// edition, and its own presence is asserted first — an anchor that stops matching must redden as a
// missing anchor rather than pass as a satisfied one.
const CLAIM_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /is the claim I am making/],
  ['architecture.pt.md', architecturePt, /é a afirmação que eu faço/],
];

// AND THE SENTENCE THAT MUST PARENTHESISE — the same defect class as `CLAIM_CLAUSE`, from the other side.
// `SURFACES` only forbids a BARE form on these two files, and `toContain(CURRENT)` is satisfied by the
// `accDescr` further down, so the opening sentence — the one occurrence this page's whole rendering rule
// is ABOUT — was guarded by nothing: reverting it to the strict form, or deleting the term from it, or
// changing it in one edition only, all shipped green. The third is the one that matters most, since a
// suite whose purpose is cross-surface consistency was reporting consistency while the editions diverged.
//
// SAME ANCHOR DISCIPLINE AS ABOVE, for the same #448 reason, and stated once here rather than twice:
// the anchor's presence and uniqueness are asserted FIRST, so a reworded opening fails as a moved anchor
// rather than passing as a satisfied one; emphasis markers are stripped rather than matched; and the
// assertion is on the text ADJACENT to the anchor, not on a line number.
//
// THE ANCHOR IS PER EDITION, not a shared phrase. The two editions are written, not translated — they
// share no clause — and assuming they did has already cost this page one round.
const PARENTHESISED = '(Agent) Harness Engineering';
const OPENING_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /a loop built on AI-DLC & /],
  ['architecture.pt.md', architecturePt, /um loop construído sobre AI-DLC & /],
];

describe('the practice is named consistently across every surface', () => {
  it.each(SURFACES)('%s names the current term', (_name, src) => {
    expect(src).toContain(CURRENT);
  });

  it.each(SURFACES)('%s carries no un-prefixed form of it', (_name, src, bare) => {
    // Historical notes are allowed to NAME the supersession — what is forbidden is the bare form
    // standing as the practice's name. The lookbehind draws exactly that line: `Agent Harness
    // Engineering` passes, a lone `Harness Engineering` does not, wherever it sits. The pattern comes
    // from the surface's own row, so a prose surface's parenthesised affordance never reaches the CV.
    expect(src).not.toMatch(bare);
  });

  it.each(SURFACES)('%s is clear of the retired term in every inflection', (_name, src) => {
    expect(src).not.toMatch(RETIRED_STEM);
  });

  // THE EXCEPTION HAS TO STILL DISCRIMINATE, and reading it never proves that. A pattern that accepted
  // every rendering would make the assertion above a tautology and stay green on the day the term is
  // reverted — the exact failure this file was written to stop, arriving through the allowlist instead
  // of through the term. So both patterns are exercised against literals here, in both directions.
  it('the parenthesised affordance is scoped, not a blanket allowance', () => {
    // The prose pattern still catches a genuinely bare occurrence…
    expect('a loop built on Harness Engineering').toMatch(BARE_ALLOWING_PARENTHESISED);
    // …and accepts only the two renderings the essay is allowed to use.
    expect('a loop built on Agent Harness Engineering').not.toMatch(BARE_ALLOWING_PARENTHESISED);
    expect('a loop built on (Agent) Harness Engineering').not.toMatch(BARE_ALLOWING_PARENTHESISED);
    // The strict pattern is unchanged: the parenthesised form is still a failure on a CV surface.
    expect('AI-DLC & (Agent) Harness Engineering').toMatch(BARE_UNPREFIXED);
  });

  it.each(CLAIM_CLAUSE)('%s claims the term unqualified in the sentence that claims it', (_name, src, clause) => {
    // The anchor first, and exactly once. If #448's restructuring reworded or duplicated the clause,
    // this fails as "the anchor moved" instead of quietly guarding nothing or guarding the wrong one.
    expect(src.match(new RegExp(clause.source, 'g')) ?? []).toHaveLength(1);

    // Then the rendering immediately before it. Emphasis markers are stripped rather than matched, so
    // the assertion survives the term losing its bold and still fails on the parenthesised form —
    // `(Agent) Harness Engineering` does not end with `Agent Harness Engineering`.
    const preceding = src.slice(0, src.search(clause)).replace(/\*/g, '').trimEnd();
    expect(preceding.endsWith(CURRENT)).toBe(true);
  });

  it.each(OPENING_CLAUSE)('%s parenthesises the term in the sentence that introduces it', (_name, src, clause) => {
    // The anchor first, and exactly once — a reworded or duplicated opening reddens here, as an anchor
    // that moved, before anything is asserted about the term itself.
    const hits = src.match(new RegExp(clause.source, 'g')) ?? [];
    expect(hits).toHaveLength(1);

    // Then the rendering immediately after it. `Agent Harness Engineering` and a deleted term both fail:
    // neither STARTS with the parenthesised form. Asterisks are stripped so the assertion survives the
    // term gaining or losing its bold, exactly as `CLAIM_CLAUSE` does on the other side of its anchor.
    const start = src.search(clause) + hits[0].length;
    const following = src.slice(start, start + 80).replace(/\*/g, '').trimStart();
    expect(following.startsWith(PARENTHESISED)).toBe(true);
  });

  // The strip is asserted through the exported list rather than the file, because here the DATA is
  // the surface — a reader sees the array's contents, not its source.
  it('the landing strip carries the current term and no superseded form', () => {
    expect(STACK).toContain(CURRENT);
    expect(STACK.filter((s) => BARE_UNPREFIXED.test(s))).toEqual([]);
    expect(STACK.filter((s) => RETIRED_STEM.test(s))).toEqual([]);
  });
});
