import { describe, it, expect } from 'vitest';
import { yearsSince, careerYears, YEARS_TOKEN } from './experience';
import { profileSource, CAREER_YEARS, withYears } from '../data/profile';
import rampUpEn from '../content/rampup.en.md?raw';
import rampUpPt from '../content/rampup.pt.md?raw';

// `now` is injected in every case: a test that used the real clock would assert a different number
// each year, which is the same defect this module exists to remove.
describe('yearsSince', () => {
  it('floors to whole years, the way a CV states seniority', () => {
    expect(yearsSince('2008-03', new Date('2026-07-24'))).toBe(18); // 18y4m
    expect(yearsSince('2008-03', new Date('2026-02-01'))).toBe(17); // 17y11m — not yet 18
    expect(yearsSince('2008-03', new Date('2026-03-01'))).toBe(18); // the anniversary month counts
  });

  it('is 0 for the current month and never negative for a future date', () => {
    expect(yearsSince('2026-07', new Date('2026-07-24'))).toBe(0);
    expect(yearsSince('2030-01', new Date('2026-07-24'))).toBe(0);
  });

  it('returns 0 for an unparseable month rather than NaN', () => {
    expect(yearsSince('', new Date('2026-07-24'))).toBe(0);
    expect(yearsSince('not-a-date', new Date('2026-07-24'))).toBe(0);
  });
});

describe('careerYears', () => {
  it('measures from the EARLIEST role, not the first listed', () => {
    // The CV lists newest-first, so the earliest start is last — a naive [0] would read 2021.
    const experience = [{ start_date: '2021-01' }, { start_date: '2008-03' }, { start_date: '2014-06' }];
    expect(careerYears(experience, new Date('2026-07-24'))).toBe(18);
  });

  it('ignores roles with no start date instead of counting them as year zero', () => {
    expect(careerYears([{ start_date: '' }, { start_date: '2008-03' }], new Date('2026-07-24'))).toBe(18);
  });

  it('is 0 when there is nothing to measure', () => {
    expect(careerYears([], new Date('2026-07-24'))).toBe(0);
  });

  // A lexicographic sort passes the padded cases above and breaks on these — which is why the
  // comparison parses the month instead of sorting strings.
  it('compares by month, not by string order', () => {
    // '2008-12' < '2008-3' as strings, so a string sort would pick December as the earlier month.
    expect(careerYears([{ start_date: '2008-12' }, { start_date: '2008-3' }], new Date('2026-07-24'))).toBe(18);
    // A year-only entry sorts earliest as a string and would collapse the figure toward 0.
    expect(careerYears([{ start_date: '2008-03' }, { start_date: '2006' }], new Date('2026-07-24'))).toBe(20);
    // An unparseable entry must lose, not win.
    expect(careerYears([{ start_date: 'soon' }, { start_date: '2008-03' }], new Date('2026-07-24'))).toBe(18);
  });
});

// The point of the whole module: the published figure comes from the CV's own dates.
describe('the published figure', () => {
  it('is derived from the CV, not written into it', () => {
    expect(CAREER_YEARS).toBe(careerYears(profileSource.experience));
    expect(CAREER_YEARS).toBeGreaterThan(0);
  });

  // Whole-object, deliberately. Only headline and summary are substituted, but every other prose
  // leaf (location, descriptions, highlights, degrees, skill labels) is passed through untouched —
  // so a token authored into one of them would publish the literal `{{years}}` with lint, typecheck
  // and every field-by-field assertion still green. Checking the serialized object makes the
  // invariant structural instead of a list someone has to remember to extend.
  it('leaves no unresolved token anywhere in the published CV', () => {
    expect(JSON.stringify(profileSource)).not.toContain(YEARS_TOKEN);
  });

  it('actually substitutes the number, in both locales', () => {
    expect(profileSource.headline.en).toContain(`${CAREER_YEARS}y across SDLC`);
    expect(profileSource.headline.pt).toContain(`${CAREER_YEARS} anos em SDLC`);
  });

  // The claim this whole slice is named for: the CV and the ramp-up page cannot disagree, because
  // both resolve the same token from the same constant. Without this the page could publish a raw
  // `{{years}}` — or drift back to a typed number — with the suite still green.
  it('resolves the same figure in the ramp-up page, in both editions', () => {
    // Authored as a token in both editions, never as a number.
    expect(rampUpEn).toContain(YEARS_TOKEN);
    expect(rampUpPt).toContain(YEARS_TOKEN);

    // …and each resolves to the CV's figure, in its own wording.
    expect(withYears(rampUpEn)).toContain(`${CAREER_YEARS} years across SDLC`);
    expect(withYears(rampUpPt)).toContain(`${CAREER_YEARS} anos entre SDLC`);
    expect(withYears(rampUpEn)).not.toContain(YEARS_TOKEN);
    expect(withYears(rampUpPt)).not.toContain(YEARS_TOKEN);
  });
});
