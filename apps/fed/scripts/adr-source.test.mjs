import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  collectRecords,
  diffAgainstArtifact,
  hasAmendment,
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
  //
  // RE-KEYED from `records.length > 30` (#456). The property was right and the ruler was a fact about
  // a 48-record library: #456 folds that library toward roughly six capability documents, at which
  // point a floor of 30 goes red on a CORRECT library, and a check that fails on correct behaviour is
  // a check someone deletes — taking the anti-vacuity guard with it.
  //
  // So the floor is derived from the directory instead of restated as a number. `readdirSync` here,
  // NOT `recordFiles`: re-using the parser's own enumerator would make this assert that the parser
  // agrees with itself, which is what an empty parser also does. A different expression over the same
  // directory is what makes it a check.
  it('is asserting against a non-empty library, counted independently of the parser', () => {
    // "a numbered markdown file", which is a weaker predicate than `recordFiles`'s
    // `^(\d{4})-[a-z0-9-]+\.md$` on purpose, in both directions. Weaker so that a prose document
    // added to this directory — `README.md` today, a capability table tomorrow — does not make this
    // go red for a reason that has nothing to do with the parser. Still strict enough that a record
    // renamed OUT of the convention (`0009-Self-Hosted.md`) is counted here and skipped there, which
    // is a real inconsistency in the library and exactly what a second opinion is for.
    const onDisk = readdirSync(adrDir).filter((f) => /^\d/.test(f) && f.endsWith('.md'));

    expect(onDisk.length).toBeGreaterThan(0);
    expect(records.length).toBe(onDisk.length);
    expect(artifact.length).toBe(records.length);
  });
});

describe('parseStatus', () => {
  it('takes the class and drops the prose', () => {
    expect(parseStatus('- **Status:** accepted')).toEqual({
      status: 'accepted',
      statusLineAmended: false,
    });
    expect(
      // The filename is a REAL record, not a plausible-looking stand-in. It used to read
      // `./0004-build-time-render.md`, which no file has ever been called — harmless to this
      // assertion (it parses the status class and never opens the target) and exactly the kind of
      // rot the citation gate added in #456 exists to catch. It found this one on its first run.
      parseStatus(
        '- **Status:** superseded by [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (2026-07)',
      ),
    ).toEqual({ status: 'superseded', statusLineAmended: false });
  });

  // Named `statusLineAmended`, not `amended`, and the rename is the finding rather than tidiness: this
  // function sees ONE LINE, and the amendment convention in this library is mostly a body heading. The
  // old name claimed the whole answer while holding a fraction of it, and thirteen records were reduced
  // to three. `hasAmendment` below is what actually answers the question.
  it('keeps the amendment mention it can see, without claiming to be the whole answer', () => {
    const long =
      '- **Status:** accepted · **amended 2026-08-01** (`share-sheet` loses its only emitter when #314 unifies the two share affordances)';
    expect(parseStatus(long)).toEqual({ status: 'accepted', statusLineAmended: true });
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

  // The case both gatekeepers found missing, independently. `file` is the href: a renamed record, or a
  // hand-edit to the committed artifact, left every assertion green and published a row that 404s. The
  // header called this comparison "field by field" while skipping the one field a reader clicks.
  it('reports a RENAMED record, which is the href and was the one field left out', () => {
    const renamed = [{ ...base[0], file: 'a-renamed.md' }];
    expect(diffAgainstArtifact(renamed, base).changed.map((r) => r.id)).toEqual(['0001']);
    expect(diffAgainstArtifact(renamed, base).missing).toEqual([]);
  });
});

describe('hasAmendment', () => {
  // The bit was read from the Status line alone and was therefore false for MOST records that had been
  // amended: three say so in their status, ten more carry `## Amendment` sections and published as plain
  // "accepted". A derived value with nothing keeping it true — falsified against ADR-0003.
  it('sees an amendment section in the body, not only a mention in the status line', () => {
    expect(hasAmendment('# 0001. X\n\n## Amendment (2026-07-29) — something\n', false)).toBe(true);
    expect(hasAmendment('# 0001. X\n\nplain body\n', true)).toBe(true);
    expect(hasAmendment('# 0001. X\n\nplain body\n', false)).toBe(false);
  });

  // A HEADING, not a word search. Several records discuss amending things in prose; matching the bare
  // word would flag every one of them, and an over-reporting bit is worse than an under-reporting one
  // when the claim is about someone else's document.
  it('does not fire on prose that merely discusses amendments', () => {
    expect(hasAmendment('# 0001. X\n\nThis decision could be amended later.\n', false)).toBe(false);
  });

  // RE-KEYED from `records.filter(r => r.amended).length > 10` (#456), and this one was the worst of
  // the three: 19 records carry the flag today, and #456 folds the library toward roughly six
  // documents — so the floor does not merely go stale, it becomes IMPOSSIBLE TO SATISFY. A gate that
  // cannot be made green by any correct library is a gate that gets deleted or commented out, and the
  // property it was protecting (that `hasAmendment` is exercised by real records, not only by the
  // fixtures three describes above) goes with it.
  //
  // The property re-stated as a criterion: every record whose body carries an amendment HEADING must
  // come back flagged. Counted by a line scan rather than by `hasAmendment`'s own regex, so this is a
  // second opinion instead of the parser agreeing with itself.
  //
  // One-directional on purpose. `hasAmendment` may legitimately flag MORE than this finds — a record
  // whose amendment is announced only on its Status line carries no heading — so "flagged ⊇ headed"
  // is the true relation, and asserting equality would go red on correct behaviour.
  it('matches the real library rather than a fixture', () => {
    const carriesHeading = records.filter((r) =>
      readFileSync(join(adrDir, r.file), 'utf8')
        .split('\n')
        .some((line) => line.startsWith('#') && line.includes('Amendment')),
    );

    for (const r of carriesHeading) expect(r.amended, `${r.file} carries an amendment heading`).toBe(true);

    // Anti-vacuity, and it is the whole reason a floor was here at all: the loop above must have had
    // something to check. An empty `records` makes it iterate zero times and pass in silence — which
    // is exactly what `> 10` was stopping, keyed to a population this repo is about to change.
    expect(carriesHeading.length).toBeGreaterThan(0);
  });
});
