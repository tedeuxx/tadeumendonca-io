// The card's words against the page's words (#167).
//
// The default OG card's hook IS the hero's tagline — and it was re-typed into the generator as a
// literal, in one language, with nothing asserting the two matched. #167 doubles that surface (two
// locales, four strings), so the drift is asserted instead of trusted. A .mjs build script cannot
// import the TypeScript catalog, which is why the copy still lives in scripts/og-copy.mjs; this test
// is the join. It is the same technique the long-form content uses for its two markdown files — two
// files can drift where one object cannot, so parity is a test rather than a convention.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { CARD_COPY, META_LINE, defaultCardFile, LOCALES } from './og-copy.mjs';
import { strings } from '../src/i18n/messages';

// Lives here rather than under src/ for the same reason og-cards.test.mjs does: this app has no
// @types/node, so a .ts test cannot read a file. It imports the TypeScript catalog anyway — which is
// the whole point, since the drift being asserted is between a .mjs literal and a .ts one.
const scriptsDir = resolve(import.meta.dirname);
const sourceOf = (file) => readFileSync(join(scriptsDir, file), 'utf8');

describe('OG card copy vs the hero tagline', () => {
  // The em-dash is a page-layout join between the two hero spans, not part of the sentence — the card
  // sets them as a hook and a subline instead, so it drops the joiner and nothing else.
  const heroHook = (locale) => strings.hero.taglineLead[locale].replace(/\s*—\s*$/, '');

  it.each(LOCALES)('the %s card sets the hero’s tagline, not a second copy of it', (locale) => {
    const copy = CARD_COPY[locale];
    // Joined across the authored line breaks: the card may set the sentence over three rows, but the
    // WORDS must still be the hero's, in the hero's order. A break is layout; a different word is drift.
    expect([...copy.lines, copy.tail, copy.accent].join(' ')).toBe(heroHook(locale));
    expect(copy.sub).toBe(strings.hero.taglineAccent[locale]);
  });

  // Each edition's line plan is its own. The pt hook is three rows and the en two — not an accident of
  // width, which is what it was before: pt used to wrap wherever the browser ran out of room, stranding
  // the article "A" away from its verb. One edition line-planned and the other auto-wrapped reads as a
  // translation even when the words are a peer's.
  it('every break is authored, not left to the browser', () => {
    expect(CARD_COPY.pt.lines).toEqual(['Aprenda', 'a construir']);
    expect(CARD_COPY.en.lines).toEqual(['Learn to build']);
  });

  // Guards the false green: if the catalog lookup silently produced '' for both sides, the equality
  // above would hold having compared nothing. Same shape as og-cards.test.mjs's empty-dir guard.
  it('compared real sentences, not two empty strings', () => {
    for (const locale of LOCALES) expect(heroHook(locale).length).toBeGreaterThan(10);
  });

  it('the two editions do not ship the same words', () => {
    expect(CARD_COPY.pt.lines).not.toEqual(CARD_COPY.en.lines);
    expect(CARD_COPY.pt.sub).not.toBe(CARD_COPY.en.sub);
  });
});

describe('the meta line', () => {
  // The vocabulary hierarchy fixes the identity as "Agentic development / AI-DLC / Loop Engineering".
  // The cards said "Agentic dev" — drift on the one surface that decision names explicitly as where a
  // pt reader meets the term first.
  it('carries the canonical term, not an abbreviation of it', () => {
    expect(META_LINE).toContain('Agentic development');
    expect(META_LINE).not.toMatch(/Agentic dev\b(?!elopment)/);
  });

  // What this DOES prove: both generators still interpolate the shared constant. What it does NOT
  // prove: that the committed PNGs were re-rendered from it — CI never runs the generators, and
  // ADR-0041 records that as an accepted cost. The PNGs are evidence in the PR, not a gate here.
  it.each(['gen-og-default.mjs', 'gen-og-articles.mjs'])('%s prints it rather than its own literal', (file) => {
    const src = sourceOf(file);
    expect(src).toContain('${META_LINE}');
    expect(src).not.toContain('Agentic dev ·');
  });
});

describe('default card naming', () => {
  // English keeps the unsuffixed name because it is already pinned by every link shared since launch.
  // Renaming it to og-default.en.png would 404 the image on posts already out — the exact failure
  // ADR-0041's naming argument exists to avoid, arriving from the other direction.
  it('is additive: en keeps the pinned path, pt gets a suffix', () => {
    expect(defaultCardFile('en')).toBe('og-default.png');
    expect(defaultCardFile('pt')).toBe('og-default.pt.png');
  });
});
