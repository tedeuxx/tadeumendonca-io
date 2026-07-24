import { describe, it, expect } from 'vitest';
import { yearsSince, careerYears, YEARS_TOKEN } from './experience';
import { profileSource, CAREER_YEARS } from '../data/profile';

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
});

// The point of the whole module: the published figure comes from the CV's own dates.
describe('the published figure', () => {
  it('is derived from the CV, not written into it', () => {
    expect(CAREER_YEARS).toBe(careerYears(profileSource.experience));
    expect(CAREER_YEARS).toBeGreaterThan(0);
  });

  it('leaves no unresolved token in the published prose', () => {
    expect(profileSource.headline.en).not.toContain(YEARS_TOKEN);
    expect(profileSource.headline.pt).not.toContain(YEARS_TOKEN);
    expect(profileSource.summary?.en).not.toContain(YEARS_TOKEN);
    expect(profileSource.summary?.pt).not.toContain(YEARS_TOKEN);
    // …and the number actually landed, in both locales.
    expect(profileSource.headline.en).toContain(`${CAREER_YEARS}y across SDLC`);
    expect(profileSource.headline.pt).toContain(`${CAREER_YEARS} anos em SDLC`);
  });
});
