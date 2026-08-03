import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  collectRecords,
  diffAgainstArtifact,
  parseRecord,
  parseStatus,
  recordFiles,
} from './adr-source.mjs';

const root = resolve(import.meta.dirname, '..');
const adrDir = join(root, '..', '..', 'docs', 'adr');
const artifact = JSON.parse(
  readFileSync(join(root, 'src', 'content', 'generated', 'adrs.json'), 'utf8'),
);
const records = collectRecords(adrDir);

describe('adr index — the artifact tracks the library', () => {
  // THE ASSERTION THIS FILE EXISTS FOR. Everything below it tests a function; this one tests the
  // PROPERTY that makes the generated table trustworthy — that the committed JSON still describes the
  // decision library in the repo. Without it the page renders a plausible index of a state that no
  // longer exists, which is worse than no index on a page arguing its claims are checkable.
  it('has no ADR the artifact is missing, no artifact row without an ADR, and no changed status', () => {
    const { missing, orphaned, changed } = diffAgainstArtifact(records, artifact);
    expect({
      missing: missing.map((r) => r.file),
      orphaned: orphaned.map((r) => r.file),
      changed: changed.map((r) => r.file),
    }).toEqual({ missing: [], orphaned: [], changed: [] });
  });

  // The guard above compares two collections, and two EMPTY collections agree perfectly. If the glob
  // ever stops matching — a moved directory, a renamed convention — every diff comes back clean and the
  // suite goes green while asserting nothing at all. This is the same vacuous-pass shape this repo has
  // now been bitten by more than once, so the non-empty case is asserted rather than assumed.
  it('is asserting against a non-empty library', () => {
    expect(records.length).toBeGreaterThan(30);
    expect(artifact.length).toBe(records.length);
  });
});

describe('parseStatus', () => {
  it('takes the class and drops the prose', () => {
    expect(parseStatus('- **Status:** accepted')).toEqual({ status: 'accepted', amended: false });
    expect(
      parseStatus('- **Status:** superseded by [ADR-0004](./0004-build-time-render.md) (2026-07)'),
    ).toEqual({ status: 'superseded', amended: false });
  });

  // `amended` is a separate bit rather than a fifth class, because "accepted" and "accepted and revised
  // since" are different things to a reader choosing what to open, and folding them loses the one bit
  // that says the decision has moved.
  it('keeps the amended bit, which is the one thing the class alone would lose', () => {
    const long =
      '- **Status:** accepted · **amended 2026-08-01** (`share-sheet` loses its only emitter when #314 unifies the two share affordances)';
    expect(parseStatus(long)).toEqual({ status: 'accepted', amended: true });
  });

  // A closed set, on purpose. This repo's ADR practice has four states; a fifth is either a typo or a
  // change to the practice, and both are things a person should hear about rather than see silently
  // rendered into a table cell.
  it('refuses a status class it does not know instead of passing it through', () => {
    expect(() => parseStatus('- **Status:** probably fine')).toThrow(/unrecognised ADR status/);
  });
});

describe('parseRecord', () => {
  it('reads the number and title from the heading and the href from the filename', () => {
    const one = parseRecord(join(adrDir, '0002-fully-static-spa-no-backend.md'));
    expect(one).toEqual({
      id: '0002',
      title: 'Fully static SPA, no backend',
      file: '0002-fully-static-spa-no-backend.md',
      status: 'accepted',
      amended: false,
    });
  });
});

describe('recordFiles', () => {
  // README.md and template.md live in the same directory and are not decisions. Asserting the exclusion
  // rather than trusting the glob: a template rendered as ADR "NNNN. <short decision title>" would be a
  // visible defect on a public page, and it is exactly what a looser `*.md` would produce.
  it('excludes README and template, which are not records', () => {
    const names = recordFiles(adrDir).map((f) => f.split('/').pop());
    expect(names).not.toContain('README.md');
    expect(names).not.toContain('template.md');
    expect(names.every((n) => /^\d{4}-/.test(n))).toBe(true);
  });
});

describe('diffAgainstArtifact', () => {
  const base = [{ id: '0001', title: 'A', file: 'a.md', status: 'accepted', amended: false }];

  it('reports an ADR the artifact does not have', () => {
    expect(diffAgainstArtifact(base, []).missing.map((r) => r.id)).toEqual(['0001']);
  });

  it('reports an artifact row with no ADR behind it', () => {
    expect(diffAgainstArtifact([], base).orphaned.map((r) => r.id)).toEqual(['0001']);
  });

  // The case a set comparison cannot see, and the MOST likely drift in practice: re-statusing an ADR
  // edits a line rather than adding or removing a file, so both sides still hold the same id.
  it('reports a record whose status moved under the same id', () => {
    const restatused = [{ ...base[0], status: 'superseded' }];
    expect(diffAgainstArtifact(restatused, base).changed.map((r) => r.id)).toEqual(['0001']);
    expect(diffAgainstArtifact(restatused, base).missing).toEqual([]);
  });

  it('reports a retitled record under the same id', () => {
    const retitled = [{ ...base[0], title: 'B' }];
    expect(diffAgainstArtifact(retitled, base).changed.map((r) => r.id)).toEqual(['0001']);
  });
});
