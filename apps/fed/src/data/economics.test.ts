// The committed snapshots and their loader (#691, ADR-0055).
//
// THE DATA TEST: every file under `src/content/generated/economics/` is read through the same validator the
// page loads it with, so a hand edit that breaks the contract is red here as well as in the build. There is
// deliberately NO clock-based staleness check: it would turn red on the calendar rather than on a change.
import { describe, it, expect } from 'vitest';
import { ECONOMICS_SNAPSHOTS_URL, latestSnapshot, loadSnapshots, snapshots } from './economics';
import { SnapshotError } from './economicsSchema';
import october from '../content/generated/economics/2026-10.json';

describe('the committed snapshots', () => {
  it('loads at least the first period, oldest first', () => {
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    const ids = snapshots.map((s) => s.period.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids[0]).toBe('2026-10');
  });

  it('renders the most recent period', () => {
    expect(latestSnapshot()).toBe(snapshots.at(-1));
  });

  it('October 2026 is the owner-ruled first period: one instrument, allocation not estimable', () => {
    const s = snapshots[0];
    expect(s.coverage_source.instrument).toBe('worklog-export-v1');
    expect(s.providers.map((c) => c.allocation.state)).toEqual(['not-estimable', 'not-estimable', 'not-estimable']);
    // The measured coverage of the period, as the producer derived it from the export.
    expect(s.providers[0].consumption).toMatchObject({ runs: 4, native_runs: 0, unrecorded_runs: 4, issues: 3, coverage: 'none' });
    expect(s.providers[1].consumption.runs).toBe(0);
    expect(s.providers[2].consumption.runs).toBe(0);
  });

  it('publishes where the snapshots live, for the copied payload', () => {
    expect(ECONOMICS_SNAPSHOTS_URL).toMatch(/\/apps\/fed\/src\/content\/generated\/economics$/);
  });
});

describe('loadSnapshots', () => {
  it('refuses a file named for one period that holds another', () => {
    expect(() => loadSnapshots({ '/x/2026-11.json': october })).toThrow(/holds period 2026-10/);
  });

  it('refuses a file not named for a period', () => {
    expect(() => loadSnapshots({ '/x/october.json': october })).toThrow(/named <YYYY-MM>\.json/);
  });

  it('refuses an inadmissible snapshot, naming the file', () => {
    expect(() => loadSnapshots({ '/x/2026-10.json': { ...october, as_of: null } })).toThrow(/\/x\/2026-10\.json\.as_of/);
  });

  it('orders by period whatever the file order', () => {
    const later = { ...october, period: { id: '2026-11', start: '2026-11-01', end: '2026-11-30' }, as_of: '2026-12-02' };
    const out = loadSnapshots({ '/x/2026-11.json': later, '/x/2026-10.json': october });
    expect(out.map((s) => s.period.id)).toEqual(['2026-10', '2026-11']);
  });

  it('an empty set loads, and has no latest period to render', () => {
    expect(loadSnapshots({})).toEqual([]);
    expect(() => latestSnapshot([])).toThrow(SnapshotError);
  });
});
