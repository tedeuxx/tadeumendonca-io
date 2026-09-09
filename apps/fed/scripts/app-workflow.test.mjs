// Guards the property that makes `npm-audit` in `.github/workflows/app.yml` a gate rather than a
// decoration: it must not be reachable only through a filter keyed on the DIFF.
//
// WHY A TEST AND NOT A COMMENT. `npm-audit` reported `skipped` on the five most recent `main` runs,
// including the merge base of the PR that finally surfaced a real advisory — every one of them a
// VERSION-only bump, which starts `npm-ci` but not `code`. Nothing was red, nothing was wrong, and the
// axis had not been measured in five runs. A path-filtered gate that was skipping is not a gate that was
// passing, and no other tool here can see the difference: actionlint validates SYNTAX and every
// regression below is perfectly valid YAML.
//
// The class is specific to THIS job and does not generalise to its neighbours. eslint, tsc, build-static
// and playwright all read files the PR changed, so gating them on the changed paths is exactly right.
// `npm-audit`'s subject is the lockfile CROSSED WITH A LIVE ADVISORY DATABASE, and the second half moves
// with no commit at all — so "nothing under apps/** changed" is evidence about the wrong input.
//
// It reads the workflow from disk, like `deploy-workflow.test.mjs` reads deploy.yml (#205's pattern): the
// artifact under test is the committed file, not a copy of it restated here.
//
// ⚠️ IT ONLY RUNS BECAUSE `.github/workflows/app.yml` IS IN ITS OWN `test` FILTER. A guard whose trigger
// is missing from the gate's filter is correct and never runs — the note beside `docs/adr/**` in that
// filter is the same lesson, paid for several times over.
//
// WHAT IT CANNOT ASSERT, so the green is not over-read: nothing here proves the job was ever DISPATCHED,
// and nothing proves a new advisory against an untouched lockfile is seen at all — no run is scheduled.
// This pins the condition, not the coverage.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

const WORKFLOW_PATH = resolve(import.meta.dirname, '../../../.github/workflows/app.yml');
const source = readFileSync(WORKFLOW_PATH, 'utf8');
const workflow = yaml.load(source);

const jobs = workflow.jobs;
const npmAudit = jobs['npm-audit'];
const npmCi = jobs['npm-ci'];

// `needs:` accepts a scalar or a sequence; normalise so an assertion cannot pass on the shape alone.
const needsOf = (job) =>
  Array.isArray(job.needs) ? job.needs : job.needs === undefined ? [] : [job.needs];

describe('app.yml — npm-audit is not gated on the diff', () => {
  it('carries no `if:` at all, so no path filter can make it inert', () => {
    // The exact regression this pins: `if: needs.changes.outputs.code == 'true'`, which is what produced
    // five unmeasured greens. Any `if:` here is either a narrowing of npm-ci's condition or a copy of it
    // that will drift; both are the defect.
    expect(npmAudit.if).toBeUndefined();
  });

  it('depends on npm-ci and on nothing else, so "whenever the tree is installed" is stated once', () => {
    // A SKIPPED dependency skips the dependent, so this need IS the condition. Listing `changes` here
    // again would re-introduce a reader for its outputs and invite a second copy of npm-ci's boolean.
    expect(needsOf(npmAudit)).toEqual(['npm-ci']);
  });

  it('is not reachable on strictly fewer triggers than the install it depends on', () => {
    // Reads npm-ci's own condition rather than restating the filter categories: if npm-ci is widened or
    // narrowed later, npm-audit follows by construction, and this asserts nothing stands between them.
    expect(npmCi.if).toContain('needs.changes.outputs.test');
    expect(npmCi.if).toContain('needs.changes.outputs.version');
    expect(npmCi.if).toContain('needs.changes.outputs.citations');
    expect(npmAudit.if ?? null).toBeNull();
  });

  it('still runs the blocking audit command and still feeds the required check', () => {
    // Removing the filter is worthless if the job stops auditing or stops being aggregated: `build-test`
    // is the required check, and a job absent from its `needs` cannot fail the merge.
    const runs = npmAudit.steps.map((s) => s.run).filter(Boolean);
    expect(runs).toContain('npm run audit');
    expect(needsOf(jobs['build-test'])).toContain('npm-audit');
  });
});

describe('app.yml — the "what was verified" report names npm-audit wherever it runs', () => {
  // The aggregator's own comment: a check that ran must never read like one that did not, and the inverse
  // is the same defect. Those strings are hand-maintained against the `if:` conditions and nothing else
  // asserts they agree — npm-audit now runs on all three branches below.
  const report = jobs['build-test'].steps
    .map((s) => s.run)
    .filter(Boolean)
    .join('\n');

  const branch = (marker) => {
    const lines = report.split('\n').filter((l) => l.includes(marker));
    expect(lines, `no report line containing "${marker}"`).toHaveLength(1);
    return lines[0];
  };

  it.each([
    ['citation-surface-only change'],
    ['docs/adr or deploy.yml-only change'],
    ['VERSION-only change'],
  ])('names npm-audit in the "%s" notice', (marker) => {
    expect(branch(marker)).toContain('npm-audit');
  });

  it('does NOT name npm-audit where npm-ci is skipped, so the report stays honest both ways', () => {
    // harness-only and no-match both skip npm-ci, which skips npm-audit. Claiming it ran there would be
    // the same defect pointed the other way, and it is the direction a careless sweep introduces.
    expect(branch('CLAUDE.md-only change')).not.toContain('npm-audit');
    expect(branch('no gated changes')).not.toContain('npm-audit');
  });
});
