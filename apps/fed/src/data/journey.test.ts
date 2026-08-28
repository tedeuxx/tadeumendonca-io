// The approved journey set (#127, extended to five by #548).
//
// WHY THE FILENAMES ARE WRITTEN OUT AS LITERALS HERE, when every other assertion in this slice is
// deliberately derived from the data: because THIS is the one fact that is not the builder's. The owner
// approved four specific photographs, in a specific order, on 2026-08-25 ("de acordo"), and two of the
// eleven he did not approve were excluded on stated grounds rather than by taste — one carries a legible
// internal client project name, one carries two other identifiable people. ONLY THE FIRST OF THOSE TWO IS
// A STANDING BAR: what he decided on 2026-08-27 about a frame carrying other people is recorded in the
// third-party paragraph below, and it is a decision about THAT frame. A derived assertion ("there are as
// many entries as there are entries") would go green on a set someone else had quietly changed, which is
// exactly the change this repo cannot afford to make silently: publishing a photograph is irreversible in
// the way OG art already is — a scraper that fetches it keeps it.
//
// So this test is a LOCK, not a measurement. Adding, removing, substituting or reordering a photograph
// turns it red, and the correct response is to get the owner's approval and edit the literals in the same
// commit — never to relax the assertion.
//
// THE THIRD PARTIES IN `journey-manila.jpg` ARE PUBLISHED ON THE OWNER'S EXPLICIT DECISION (#548), AND
// WHAT HE AUTHORISED IS THIS ONE FRAME. One of the two 2026-08-25 exclusions was "carries two other
// identifiable people". This frame carries SEVEN identifiable presences: six full faces, plus a seventh
// at the extreme left edge — a half-face (hair, brow, one eye, cheek, jawline) above a vertically striped
// shirt, cut by the frame and still recognisable. That count is of the PUBLISHED 660x880 crop and was
// taken on the committed bytes, where anyone can re-take it:
//
//   ffmpeg -i apps/fed/public/photos/journey-manila.jpg -vf "crop=120:260:0:440,scale=600:1300" out.png
//
// He was told, in those terms and before choosing — identifiable faces, several wearing badges — and
// chose this frame anyway, because it is the only photograph that exists from 2008–2015. THAT IS THE
// WHOLE OF WHAT IS DOCUMENTED, and it is deliberately not generalised into a characterisation of the
// 2026-08-25 ruling or into a licence for the next frame: another photograph carrying people who are not
// him is a fresh decision of his, asked and recorded the same way, not something this one already
// settled. WHAT IS A STANDING BAR is the other exclusion: a legible internal client name. That one is
// about confidentiality rather than taste, and no photograph clears it by being the only one left.
import { describe, it, expect } from 'vitest';
import {
  assertJourneyShape,
  engagementKey,
  JOURNEY_PHOTOS,
  resolveJourney,
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

// The exact set the owner approved. THE LOCK IS ON THE SET — these five frames — RATHER THAN ON THE
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
  // #548, 2026-08-27. He named the ROLE that needed a frame, then the photograph, then the file — and
  // declined two alternatives from the same folder before choosing this one. It is the only frame in the
  // set he is not in, and the only one whose subject is other people; that it is here at all is his call
  // and not the builder's, which is exactly what this lock exists to make unfakeable.
  '/photos/journey-manila.jpg',
];

// Which EXPERIENCE ENTRY each frame is from — the owner's answer, resolved to the pair `profile.ts` can
// be joined on (#516, 2026-08-25), locked for the same reason the filenames are: it is not the builder's
// fact, and it is not derivable. Three of these five could not have been reached any other way.
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
  // The third frame that could not have been derived, and the most emphatic of them: its filename carries
  // a 2021 export stamp and the frame carries no year, so nearest-date would place it four employers away
  // from where he put it. `Accenture` names two entries, which is why the pair matters here more than
  // anywhere else in this table.
  '/photos/journey-manila.jpg': { company: 'Accenture', start_date: '2008-03' },
};

describe('the journey set is the one the owner approved', () => {
  it('is exactly those five frames', () => {
    expect([...JOURNEY_PHOTOS.map((p) => p.photo.src)].sort()).toEqual([...APPROVED].sort());
  });

  // THE TRANSITIONAL ORDER CASE IS GONE (#516 slice 2b), deleted in the slice its own comment named. It
  // asserted `JOURNEY_PHOTOS` rendered top-to-bottom in the authored sequence, and was kept through slice
  // 1 only because `JourneyStrip` still put that sequence in front of a reader. The strip is deleted here;
  // each frame now renders inside the experience entry its `engagement` names, so the array's order
  // reaches nobody and an assertion on it would be a lock on a fact with no consumer. The set lock above
  // is the one that outlives it, exactly as that comment said it would.

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

  it('treats the whole set as one set: same aspect ratio, portrait', () => {
    // The consistency is the whole reason photographs from five cameras across fifteen years read as a
    // set rather than as five snapshots, and it is a property of the COMMITTED FILES — which
    //
    // IT IS ALSO A REAL CONSTRAINT ON WHAT CAN BE ADDED, and #548 is what proved that. The Manila source
    // is SQUARE, so shipping it un-recropped would have failed here — and the correct response was to
    // recrop the file, never to widen this assertion. Losing 25% of that frame's width is the price of
    // the set reading as one thing; that trade is recorded in `journey.ts`'s provenance paragraph.
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

  it('accepts two frames whose pairs differ only by the field on the other side of the separator', () => {
    // The control for `engagementKey`'s separator, and the only test that can catch it being replaced by
    // something an employer name or a date could contain. `'A-B' + '' + 'C'` and `'A' + '' + 'B-C'` are
    // two different placements that a hyphen (or any other printable joiner) would collapse into the same
    // string — and the guard would then refuse a perfectly valid second frame with "both claim the
    // experience entry", pointing at the wrong cause.
    const EDGE: readonly EngagementKey[] = [
      { company: 'A-B', start_date: 'C' },
      { company: 'A', start_date: 'B-C' },
    ];
    expect(() =>
      assertJourneyShape(
        [
          entry({ engagement: { company: 'A-B', start_date: 'C' } }),
          entry({ src: '/photos/journey-corridor.jpg', engagement: { company: 'A', start_date: 'B-C' } }),
        ],
        EDGE,
      ),
    ).not.toThrow();
  });

  it('reads its argument, never the shipped set', () => {
    // The one that keeps the cases above honest: if the guard secretly validated `JOURNEY_PHOTOS` it
    // would pass every test here for the wrong reason, and would still be green on a broken entry.
    expect(() => assertJourneyShape([entry({ src: '/photos/never-committed.jpg' })], EXPERIENCE)).toThrow();
    expect(() => assertJourneyShape([], EXPERIENCE)).not.toThrow();
  });
});

// `resolveJourney` is what a component receives (#516 slice 2b): the same five frames with one edition's
// prose picked, so `CVSection` stays pure and never reads the locale context itself.
describe('resolveJourney flattens the set to one edition', () => {
  it('keeps the whole set, with the asset and the placement key untouched', () => {
    for (const locale of LOCALES) {
      const frames = resolveJourney(locale);
      expect(frames).toHaveLength(JOURNEY_PHOTOS.length);
      frames.forEach((frame, i) => {
        expect(frame.photo).toBe(JOURNEY_PHOTOS[i].photo);
        expect(frame.engagement).toEqual(JOURNEY_PHOTOS[i].engagement);
      });
    }
  });

  it('picks the requested edition, and not the other one', () => {
    // Asserted against the SOURCE record rather than against literals, and in both directions: a resolver
    // that returned `pt` for every locale would pass a one-sided check on the pt edition alone.
    for (const locale of LOCALES) {
      resolveJourney(locale).forEach((frame, i) => {
        expect(frame.alt, `alt[${locale}]`).toBe(JOURNEY_PHOTOS[i].alt[locale]);
        expect(frame.caption, `caption[${locale}]`).toBe(JOURNEY_PHOTOS[i].caption[locale]);
      });
    }
  });

  it('gives the two editions different words', () => {
    // The failure this catches is the one that actually happened on #235: one edition served for the
    // other. A per-locale equality check passes on a copy; a difference check does not.
    const pt = resolveJourney('pt');
    const en = resolveJourney('en');
    pt.forEach((frame, i) => {
      expect(frame.alt, frame.photo.src).not.toBe(en[i].alt);
      expect(frame.caption, frame.photo.src).not.toBe(en[i].caption);
    });
  });
});

// The join spelling itself. It is exported so `assertJourneyShape` and `CVSection` cannot drift apart —
// the guard promises "at most one frame per entry" about the lookup the layout actually performs.
describe('engagementKey is one spelling of the join', () => {
  it('separates two pairs that would collide under a printable joiner', () => {
    expect(engagementKey({ company: 'A-B', start_date: 'C' })).not.toBe(
      engagementKey({ company: 'A', start_date: 'B-C' }),
    );
  });

  it('is stable for equal pairs authored independently', () => {
    expect(engagementKey({ company: 'Globo.com', start_date: '2020-06' })).toBe(
      engagementKey({ company: 'Globo.com', start_date: '2020-06' }),
    );
  });

  it('reads the pair off anything carrying the two fields, which is how the layout calls it', () => {
    // `CVSection` passes a whole `ExperienceItem` — company, start_date, title, dates, highlights. If this
    // ever started reading a third field, the component's lookup would silently stop matching.
    const [first] = profileSource.experience;
    expect(engagementKey(first)).toBe(
      engagementKey({ company: first.company, start_date: first.start_date }),
    );
  });
});
