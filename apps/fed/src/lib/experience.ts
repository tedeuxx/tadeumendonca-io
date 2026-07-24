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
  if (!year) return 0;
  // A year-only date ("2006") means January of that year — the same reading CVSection already gives it
  // when rendering a graduation year. Accepting it here keeps this consistent with monthIndex below;
  // rejecting it in one and accepting it in the other silently produced 0.
  const startMonth = month || 1;
  const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - startMonth);
  return Math.max(0, Math.floor(months / 12));
}

/** Absolute month number, for comparing dates without relying on how their strings sort. */
function monthIndex(isoMonth: string): number {
  const [year, month] = isoMonth.split('-').map(Number);
  return year ? year * 12 + (month || 1) : Number.POSITIVE_INFINITY;
}

/**
 * Career length from the earliest role on record.
 *
 * Compared by parsed month, NOT lexicographically. A string sort looks equivalent for zero-padded
 * `YYYY-MM` and silently breaks otherwise: `'2008-12' < '2008-3'`, and a year-only `'2006'` — the
 * form this very CV already uses for education dates — would sort earliest and collapse the published
 * figure to `0`. An unparseable entry sorts last rather than winning.
 */
export function careerYears(experience: readonly { start_date: string }[], now: Date = new Date()): number {
  const starts = experience.map((role) => role.start_date).filter(Boolean);
  if (starts.length === 0) return 0;
  // Seeded explicitly: a bare reduce() throws on an empty array, and while the guard above prevents
  // that, the seed states the invariant locally instead of making a reader verify it two lines up.
  const earliest = starts.reduce((min, current) => (monthIndex(current) < monthIndex(min) ? current : min), starts[0]);
  return yearsSince(earliest, now);
}
