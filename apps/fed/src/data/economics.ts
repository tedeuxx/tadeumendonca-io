// The typed loader for the committed delivery-economics snapshots (#691, ADR-0055).
//
// THE BUILD READS ONLY WHAT IS COMMITTED. A snapshot is produced offline on the owner's machine by
// `npm --prefix apps/fed run gen-economics` and committed under `src/content/generated/economics/`; nothing here
// fetches a provider, a billing system, the tracker or another repository, at build time or at runtime
// (ADR-0002). This is the same committed-artifact shape as the ADR index and the harness manifest.
//
// VALIDATED AT MODULE LOAD, so an inadmissible snapshot fails the build and the prerender rather than
// rendering. `economicsSchema.ts` is the validator; this module only finds the files and orders them.
import { SnapshotError, validateSnapshot, type Snapshot } from './economicsSchema';

/** The committed snapshots, as one URL — where the copy-as-markdown payload points instead of the empty fence. */
export const ECONOMICS_SNAPSHOTS_URL =
  'https://github.com/tedeuxx/tadeumendonca-io/tree/main/apps/fed/src/content/generated/economics';

const FILE = /\/(\d{4}-\d{2})\.json$/;

/** Validates every snapshot and orders them by period. A file named for one period holding another throws. */
export function loadSnapshots(files: Record<string, unknown>): Snapshot[] {
  return Object.entries(files)
    .map(([path, data]) => {
      const id = FILE.exec(path)?.[1];
      if (!id) throw new SnapshotError(`${path}: a snapshot file is named <YYYY-MM>.json`);
      const snapshot = validateSnapshot(data, path);
      if (snapshot.period.id !== id) throw new SnapshotError(`${path}: holds period ${snapshot.period.id}`);
      return snapshot;
    })
    .sort((a, b) => a.period.id.localeCompare(b.period.id));
}

const committed = import.meta.glob('../content/generated/economics/*.json', { eager: true, import: 'default' });

/** Every committed period, oldest first. */
export const snapshots: Snapshot[] = loadSnapshots(committed);

/** The most recent committed period, which is the one the section renders. */
export function latestSnapshot(list: Snapshot[] = snapshots): Snapshot {
  const latest = list.at(-1);
  if (!latest) throw new SnapshotError('no delivery-economics snapshot is committed');
  return latest;
}
