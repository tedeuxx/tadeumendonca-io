// Years of experience, DERIVED from the CV's own dates rather than written down.
//
// It was hardcoded as "17" in six places and had been wrong for over a year — the figure was correct
// when written and nothing recomputed it (issue #82). A hardcoded elapsed time is stale the moment a
// birthday passes, and it was published across four surfaces, so the drift was invisible from any one
// of them.
//
// Computed at module load, which means the prerendered HTML carries the build-time value and the live
// SPA recomputes after hydration. Those differ only in the days between a deploy and an anniversary,
// and the next deploy resolves it — a bounded, self-healing skew, unlike the unbounded one it replaces.

/** The placeholder authored into prose wherever the figure appears. Never type the number itself. */
export const YEARS_TOKEN = '{{years}}';

/**
 * Whole years elapsed since an `YYYY-MM` month, floored — the way a CV states seniority.
 *
 * Read in UTC deliberately. With local getters, `new Date('2026-03-01')` (parsed as UTC midnight)
 * reads as February in any negative-offset timezone, so the anniversary month landed a month late —
 * and worse, the prerender (CI, UTC) and a reader's browser (BRT) would disagree for a day. UTC on
 * both sides makes the figure identical everywhere.
 */
export function yearsSince(isoMonth: string, now: Date = new Date()): number {
  const [year, month] = isoMonth.split('-').map(Number);
  if (!year || !month) return 0;
  const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}

/**
 * Career length from the earliest role on record. `YYYY-MM` strings sort lexicographically, so the
 * earliest start date is simply the smallest — no date parsing needed to find it.
 */
export function careerYears(experience: readonly { start_date: string }[], now: Date = new Date()): number {
  const earliest = experience
    .map((role) => role.start_date)
    .filter(Boolean)
    .sort()[0];
  return earliest ? yearsSince(earliest, now) : 0;
}
