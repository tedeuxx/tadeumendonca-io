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
import {
  assertJourneyShape,
  JOURNEY_PHOTOS,
  type EngagementKey,
  type JourneyEntry,
} from './journey';
import { profileSource } from './profile';
import { LOCALES } from '../i18n';

// A stand-in for `profile.ts`'s experience array, so every join case below is exercised against data
// this test OWNS. The three refusals are drift cases by nature — an employer renamed, a date corrected,
// a second frame added — and the only honest way to watch one fire is to author the drift, which cannot
// be done to the real CV from inside a test. The two `Ambiguous Co` rows exist for one case and one
// only: two entries sharing a company AND a start_date, which is what `assertJourneyShape` refuses as
// unresolvable. The real CV has no such pair, and the last case in this file is what asserts that.
const EXPERIENCE: readonly EngagementKey[] = [
  { company: 'Globo.com', start_date: '2020-06' },
  { company: 'Accenture', start_date: '2015-01' },
  { company: 'Ambiguous Co', start_date: '2019-01' },
  { company: 'Ambiguous Co', start_date: '2019-01' },
];

/** A valid authored entry, overridable one field at a time — the `library.test.ts` fixture shape. */
const entry = (over: Partial<JourneyEntry> = {}): JourneyEntry => ({
  src: '/photos/journey-sticker-lid.jpg',
  engagement: { company: 'Globo.com', start_date: '2020-06' },
  alt: { pt: 'O que está no quadro', en: 'What is in the frame' },
  caption: { pt: 'Por que está na página', en: 'Why it is on the page' },
  ...over,
});

// The exact set the owner approved. THE LOCK IS ON THE SET — these four frames — RATHER THAN ON THE
// SEQUENCE (#516, owner ruling 2026-08-25). The order this array is written in was itself an owner
// decision (`journey.ts`: the craft, the work, the chapter, the place), and it was a decision about how
// four photographs read AS A SET at the end of the page. Once each frame sits inside the dated experience
// entry its `engagement` names, there is no set and no photograph sequence left to decide: the entries
// already have an order, and the frames inherit it. That decision loses its OBJECT — it is not overruled,
// and nothing here reverses it.
const APPROVED = [
  '/photos/journey-sticker-lid.jpg',
  '/photos/journey-home-office.jpg',
  '/photos/journey-aws-summit.jpg',
  '/photos/journey-corridor.jpg',
];

// Which EXPERIENCE ENTRY each frame is from — the owner's answer, resolved to the pair `profile.ts` can
// be joined on (#516, 2026-08-25), locked for the same reason the filenames are: it is not the builder's
// fact, and it is not derivable. Two of these four could not have been reached any other way.
// `journey-sticker-lid.jpg` has no date anywhere in this repository (the committed bytes carry no
// metadata, which `scripts/photo-assets.test.mjs` proves), and `journey-home-office.jpg` is the frame
// where BOTH available derivations — nearest date, and what is in the frame — landed on Globo and were
// wrong. A derived assertion here would re-derive the defect it exists to catch.
//
// WRITTEN OUT RATHER THAN IMPORTED FROM `journey.ts`. The values are spelled here a second time on
// purpose — importing the `at()` helper or the AWS constant would make this file agree with the source
// by construction and assert nothing about it. The cost is that correcting an attribution is two edits;
// the benefit is that a wrong attribution is one.
const ENGAGEMENTS: Record<string, EngagementKey> = {
  '/photos/journey-home-office.jpg': { company: 'Accenture', start_date: '2015-01' },
  '/photos/journey-sticker-lid.jpg': { company: 'Globo.com', start_date: '2020-06' },
  '/photos/journey-corridor.jpg': {
    company: 'Amazon Web Services — Professional Services',
    start_date: '2021-01',
  },
  '/photos/journey-aws-summit.jpg': {
    company: 'Amazon Web Services — Professional Services',
    start_date: '2023-04',
  },
};

describe('the journey set is the one the owner approved', () => {
  it('is exactly those four frames', () => {
    expect([...JOURNEY_PHOTOS.map((p) => p.photo.src)].sort()).toEqual([...APPROVED].sort());
  });

  it('still renders in the authored order, for as long as the strip is what a reader meets', () => {
    // TRANSITIONAL, and kept deliberately rather than dropped with the order rule it used to cite.
    // Slice 1 ships NO layout change at all: `JourneyStrip` still renders this array top to bottom, so
    // the sequence is still something a reader receives today. Relaxing it in the same slice that leaves
    // the strip standing would drop a live guarantee one whole slice early — an accidental reorder would
    // reach the page green. Delete this case WITH the strip (#516 slice 2), not before; the case above is
    // the lock that outlives it.
    expect(JOURNEY_PHOTOS.map((p) => p.photo.src)).toEqual(APPROVED);
  });

  it('carries the engagement the owner authored, for every frame', () => {
    // The length check is what stops this going green-but-vacuous: without it, an entry whose `src` is
    // absent from ENGAGEMENTS would compare `undefined` against `undefined` and pass.
    expect(Object.keys(ENGAGEMENTS)).toHaveLength(APPROVED.length);
    for (const { photo, engagement } of JOURNEY_PHOTOS) {
      // `toEqual`, not `toBe`: the key is an object now, and `toBe` would compare identity and pass on
      // nothing but the same reference — which no two independently authored literals ever are.
      expect(engagement, photo.src).toEqual(ENGAGEMENTS[photo.src]);
    }
  });

  it('resolves every frame to exactly one entry of the REAL CV, not of a fixture', () => {
    // The case that makes the module-load guard mean something about production data. Everything in the
    // second describe block runs against `EXPERIENCE`, a fixture this file owns; this one runs the same
    // resolution against `profile.ts` itself, so a CV edit that orphans a frame — or that introduces the
    // duplicate pair the fixture has to fake — fails HERE by name rather than as an opaque import error.
    expect(profileSource.experience.length).toBeGreaterThan(1);
    for (const { photo, engagement } of JOURNEY_PHOTOS) {
      const matches = profileSource.experience.filter(
        (item) =>
          item.company === engagement.company && item.start_date === engagement.start_date,
      );
      expect(matches, photo.src).toHaveLength(1);
    }
  });

  it('places no two frames on the same experience entry', () => {
    const keys = JOURNEY_PHOTOS.map(
      ({ engagement }) => `${engagement.company}\u0000${engagement.start_date}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
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
    expect(() => assertJourneyShape([entry()], EXPERIENCE)).not.toThrow();
  });

  it('refuses a file that is not in the photograph registry', () => {
    // The registry is what supplies width/height, so an unregistered file renders with no reserved box.
    expect(() => assertJourneyShape([entry({ src: '/photos/never-committed.jpg' })], EXPERIENCE)).toThrow(
      /not in the photograph registry/,
    );
  });

  it('refuses an entry with no authored engagement at all', () => {
    // Deleting the key rather than blanking it: this is the shape a future layout slice would actually
    // produce — a fifth frame added with `src`, `alt` and `caption` copied from a neighbour and the
    // attribution simply forgotten.
    const withoutEngagement: Partial<JourneyEntry> = { ...entry() };
    delete withoutEngagement.engagement;
    expect(() => assertJourneyShape([withoutEngagement as JourneyEntry], EXPERIENCE)).toThrow(
      /has no authored engagement/,
    );
  });

  it('refuses a blank engagement', () => {
    expect(() =>
      assertJourneyShape([entry({ engagement: { company: '   ', start_date: '   ' } })], EXPERIENCE),
    ).toThrow(/has no authored engagement/);
  });

  it('refuses an engagement no experience entry matches', () => {
    // The DRIFT case, and the one this join is most likely to meet in real life: `Globo.com` renamed in
    // `profile.ts`, a start_date corrected, or the AWS em dash retyped as a hyphen. Each one silently
    // orphans a frame, and a layout keyed on the join would then place it nowhere — or somewhere.
    expect(() =>
      assertJourneyShape(
        [entry({ engagement: { company: 'Globo', start_date: '2020-06' } })],
        EXPERIENCE,
      ),
    ).toThrow(/names an engagement no experience entry matches/);
  });

  it('refuses an engagement matching more than one experience entry', () => {
    // The case a bare employer name produced for real, before the key became a pair: `Accenture` named
    // two entries and `AWS Professional Services` named two. Two entries a frame could equally belong to
    // is not a placement, and picking one by date is the derivation this module forbids.
    expect(() =>
      assertJourneyShape(
        [entry({ engagement: { company: 'Ambiguous Co', start_date: '2019-01' } })],
        EXPERIENCE,
      ),
    ).toThrow(/names an engagement matching 2 experience entries/);
  });

  it('refuses two frames claiming the same experience entry', () => {
    // Without this the failure is SILENT: two figures stack inside one experience block and every other
    // assertion here stays green. The message names both frames, which is why the guard keeps a Map.
    expect(() =>
      assertJourneyShape(
        [entry(), entry({ src: '/photos/journey-corridor.jpg' })],
        EXPERIENCE,
      ),
    ).toThrow(/both claim the experience entry/);
  });

  it('accepts two frames on two different entries', () => {
    // The control for the case above. Without it, a guard that refused EVERY second frame would pass
    // that test for the wrong reason and make the layout impossible one slice later.
    expect(() =>
      assertJourneyShape(
        [
          entry(),
          entry({
            src: '/photos/journey-corridor.jpg',
            engagement: { company: 'Accenture', start_date: '2015-01' },
          }),
        ],
        EXPERIENCE,
      ),
    ).not.toThrow();
  });

  it.each(LOCALES)('refuses a blank %s alt text', (locale) => {
    const alt = { ...entry().alt, [locale]: '   ' };
    expect(() => assertJourneyShape([entry({ alt })], EXPERIENCE)).toThrow(new RegExp(`no ${locale} alt text`));
  });

  it.each(LOCALES)('refuses a blank %s caption', (locale) => {
    const caption = { ...entry().caption, [locale]: '' };
    expect(() => assertJourneyShape([entry({ caption })], EXPERIENCE)).toThrow(new RegExp(`no ${locale} caption`));
  });

  it.each(LOCALES)('refuses the %s caption being reused as alt text', (locale) => {
    const base = entry();
    const alt = { ...base.alt, [locale]: base.caption[locale] };
    expect(() => assertJourneyShape([entry({ alt })], EXPERIENCE)).toThrow(
      new RegExp(`reuses its ${locale} caption as alt text`),
    );
  });

  it('reads its argument, never the shipped set', () => {
    // The one that keeps the cases above honest: if the guard secretly validated `JOURNEY_PHOTOS` it
    // would pass every test here for the wrong reason, and would still be green on a broken entry.
    expect(() => assertJourneyShape([entry({ src: '/photos/never-committed.jpg' })], EXPERIENCE)).toThrow();
    expect(() => assertJourneyShape([], EXPERIENCE)).not.toThrow();
  });
});
