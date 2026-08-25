// The approved journey set (#127).
//
// WHY THE FILENAMES ARE WRITTEN OUT AS LITERALS HERE, when every other assertion in this slice is
// deliberately derived from the data: because THIS is the one fact that is not the builder's. The owner
// approved four specific photographs, in a specific order, on 2026-08-25 ("de acordo"), and two of the
// eleven he did not approve were excluded by RULING rather than by taste — one carries a legible internal
// client project name, one carries two other identifiable people. A derived assertion ("there are as many
// entries as there are entries") would go green on a set someone else had quietly changed, which is
// exactly the change this repo cannot afford to make silently: publishing a photograph is irreversible in
// the way OG art already is — a scraper that fetches it keeps it.
//
// So this test is a LOCK, not a measurement. Adding, removing, substituting or reordering a photograph
// turns it red, and the correct response is to get the owner's approval and edit the literals in the same
// commit — never to relax the assertion.
import { describe, it, expect } from 'vitest';
import { assertJourneyShape, JOURNEY_PHOTOS, type JourneyEntry } from './journey';
import { LOCALES } from '../i18n';

/** A valid authored entry, overridable one field at a time — the `library.test.ts` fixture shape. */
const entry = (over: Partial<JourneyEntry> = {}): JourneyEntry => ({
  src: '/photos/journey-sticker-lid.jpg',
  alt: { pt: 'O que está no quadro', en: 'What is in the frame' },
  caption: { pt: 'Por que está na página', en: 'Why it is on the page' },
  ...over,
});

// The exact set the owner approved, in the exact order he approved it in.
const APPROVED = [
  '/photos/journey-sticker-lid.jpg',
  '/photos/journey-home-office.jpg',
  '/photos/journey-aws-summit.jpg',
  '/photos/journey-corridor.jpg',
];

describe('the journey set is the one the owner approved', () => {
  it('is exactly those four files, in that order', () => {
    expect(JOURNEY_PHOTOS.map((p) => p.photo.src)).toEqual(APPROVED);
  });

  it('carries alt and caption in every locale, non-empty', () => {
    // Iterating `LOCALES` rather than naming `pt` and `en` is what makes this survive a third edition:
    // adding one would leave this green-but-vacuous if the locales were hard-coded.
    expect(LOCALES.length).toBeGreaterThan(1);
    for (const { photo, alt, caption } of JOURNEY_PHOTOS) {
      for (const locale of LOCALES) {
        expect(alt[locale]?.trim(), `${photo.src} alt[${locale}]`).toBeTruthy();
        expect(caption[locale]?.trim(), `${photo.src} caption[${locale}]`).toBeTruthy();
      }
    }
  });

  it('keeps alt and caption as two different jobs, in every locale', () => {
    for (const { photo, alt, caption } of JOURNEY_PHOTOS) {
      for (const locale of LOCALES) {
        expect(alt[locale], `${photo.src} [${locale}]`).not.toBe(caption[locale]);
      }
    }
  });

  it('does not translate one edition by copying the other', () => {
    for (const { photo, alt, caption } of JOURNEY_PHOTOS) {
      expect(alt.pt, `${photo.src} alt`).not.toBe(alt.en);
      expect(caption.pt, `${photo.src} caption`).not.toBe(caption.en);
    }
  });

  it('registers every photograph, so each one reserves a real box', () => {
    for (const { photo } of JOURNEY_PHOTOS) {
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
    }
  });

  it('treats the four as one set: same aspect ratio, portrait', () => {
    // The consistency is the whole reason four photographs from four cameras across three years read as a
    // set rather than as four snapshots, and it is a property of the COMMITTED FILES — which
    // `scripts/photo-assets.test.mjs` proves against each JPEG's own SOF marker. A recrop that changed one
    // of them would pass every other assertion in this slice and quietly break the grid.
    const ratios = JOURNEY_PHOTOS.map(({ photo }) => photo.width / photo.height);
    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(0.75, 2);
      expect(ratio).toBeLessThan(1);
    }
    expect(new Set(ratios).size).toBe(1);
  });
});

// Every case below feeds the guard an ARGUMENT, so each `throw` is a line that has actually been seen to
// fire. Exercising it only through the real, correct data would leave a guard nobody has watched fail —
// which is indistinguishable from a guard that does not work.
describe('assertJourneyShape refuses what the type system cannot', () => {
  it('accepts a well-formed entry', () => {
    expect(() => assertJourneyShape([entry()])).not.toThrow();
  });

  it('refuses a file that is not in the photograph registry', () => {
    // The registry is what supplies width/height, so an unregistered file renders with no reserved box.
    expect(() => assertJourneyShape([entry({ src: '/photos/never-committed.jpg' })])).toThrow(
      /not in the photograph registry/,
    );
  });

  it.each(LOCALES)('refuses a blank %s alt text', (locale) => {
    const alt = { ...entry().alt, [locale]: '   ' };
    expect(() => assertJourneyShape([entry({ alt })])).toThrow(new RegExp(`no ${locale} alt text`));
  });

  it.each(LOCALES)('refuses a blank %s caption', (locale) => {
    const caption = { ...entry().caption, [locale]: '' };
    expect(() => assertJourneyShape([entry({ caption })])).toThrow(new RegExp(`no ${locale} caption`));
  });

  it.each(LOCALES)('refuses the %s caption being reused as alt text', (locale) => {
    const base = entry();
    const alt = { ...base.alt, [locale]: base.caption[locale] };
    expect(() => assertJourneyShape([entry({ alt })])).toThrow(
      new RegExp(`reuses its ${locale} caption as alt text`),
    );
  });

  it('reads its argument, never the shipped set', () => {
    // The one that keeps the cases above honest: if the guard secretly validated `JOURNEY_PHOTOS` it
    // would pass every test here for the wrong reason, and would still be green on a broken entry.
    expect(() => assertJourneyShape([entry({ src: '/photos/never-committed.jpg' })])).toThrow();
    expect(() => assertJourneyShape([])).not.toThrow();
  });
});
