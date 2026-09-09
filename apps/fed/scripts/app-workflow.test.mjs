// Guards two properties of `.github/workflows/app.yml`: that `npm-audit` is a gate rather than a
// decoration, and that the aggregator's "what was verified" report does not lie about it.
//
// WHY A TEST AND NOT A COMMENT. `npm-audit` reported `skipped` on six consecutive `main` runs, including
// the merge base of the PR that finally surfaced a real advisory — every one a VERSION-only bump, which
// starts `npm-ci` but not `code`. Nothing was red, nothing was wrong, and the axis had not been measured
// in six runs. A path-filtered gate that was skipping is not a gate that was passing, and no other tool
// here can see the difference: actionlint validates SYNTAX and every regression below is valid YAML.
//
// The class is specific to THIS job. eslint, tsc, build-static and playwright all read files the PR
// changed, so gating them on changed paths is exactly right. `npm-audit`'s subject is the lockfile
// CROSSED WITH A LIVE ADVISORY DATABASE, and the second half moves with no commit at all.
//
// ─── WHY THE SECOND HALF IS DERIVED AND NOT ASSERTED ──────────────────────────────────────────────────
// The first version of this file hand-asserted which notices name `npm-audit`, and got one wrong: it
// claimed the CLAUDE.md-only branch was a shape where `npm-audit` does not run, and pinned that. It does
// run — `CLAUDE.md` is matched by the `citations` pattern `*.md` and is the ONLY `harness` path not also
// covered by `test`, so that branch's whole domain is a shape where `citations` is true and `npm-ci`
// starts. The green then DEFENDED the false sentence: mutating the workflow into the correct state went
// red, so the next person to fix the sentence would have hit a failing test and reverted.
//
// The lesson, which is why the shape of this file changed rather than one line of it: A MUTATION CHECK
// INHERITS THE BELIEFS OF WHOEVER WRITES THE MUTATIONS. Six mutations were run and all six went red as
// predicted; one was labelled "over-claim" on a premise nobody checked. So the notice assertions below
// no longer encode a belief about which jobs run — they COMPUTE it from the filter patterns and the job
// conditions in the file, and compare. A filter edit that changes what runs now reddens the notice that
// describes it.
//
// It reads the workflow from disk, like `deploy-workflow.test.mjs` reads deploy.yml (#205's pattern).
//
// ⚠️ IT ONLY RUNS BECAUSE `.github/workflows/app.yml` IS IN ITS OWN `test` FILTER — verified in the
// filter body below, not taken from a comment. A guard whose trigger is missing from the gate's filter is
// correct and never runs.
//
// WHAT IT STILL CANNOT ASSERT, so the green is not over-read: nothing here proves the job was ever
// DISPATCHED, and nothing proves an advisory against an untouched lockfile is seen at all — no run is
// scheduled. It pins the condition and the report, never the coverage.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

const WORKFLOW_PATH = resolve(import.meta.dirname, '../../../.github/workflows/app.yml');
const workflow = yaml.load(readFileSync(WORKFLOW_PATH, 'utf8'));

const jobs = workflow.jobs;
const npmAudit = jobs['npm-audit'];
const npmCi = jobs['npm-ci'];

// `needs:` accepts a scalar or a sequence; normalise so an assertion cannot pass on the shape alone.
const needsOf = (job) =>
  Array.isArray(job.needs) ? job.needs : job.needs === undefined ? [] : [job.needs];

// The filters are a YAML document embedded as a string in the paths-filter step's `with.filters`. Found
// by inspecting the step rather than by index, so inserting a step above it does not silently misread.
const filterStep = jobs.changes.steps.find((s) => s.uses?.startsWith('dorny/paths-filter'));
const FILTERS = yaml.load(filterStep.with.filters);

// ─── the matcher ──────────────────────────────────────────────────────────────────────────────────────
// dorny/paths-filter matches with picomatch. picomatch is only a TRANSITIVE package here, and a gate that
// breaks when an unrelated dependency reshuffles its tree is a bad gate, so this implements the three
// pattern FORMS the filters actually use and REFUSES anything else (see the form assertion below) rather
// than guessing. Verified to agree with picomatch 4.0.4 on all 600 pattern x path pairs of this
// workflow's real patterns against a corpus including `appsx/y.ts` vs `apps/**`, bare `apps`, and nested
// `.md` vs `*.md`. If a filter ever gains a new form, the assertion below reddens instead of this
// matcher answering wrongly in silence.
const formOf = (pattern) => {
  if (pattern.endsWith('/**')) return 'prefix';
  if (pattern === '*.md') return 'rootmd';
  if (!pattern.includes('*')) return 'exact';
  return null;
};

const matches = (pattern, path) => {
  switch (formOf(pattern)) {
    case 'prefix': {
      const base = pattern.slice(0, -3);
      return path === base || path.startsWith(`${base}/`);
    }
    case 'rootmd':
      return !path.includes('/') && path.endsWith('.md');
    case 'exact':
      return path === pattern;
    default:
      throw new Error(`unrecognised pattern form: ${pattern}`);
  }
};

/** Which filter categories go true for a given set of changed files. */
const categoriesFor = (changedFiles) =>
  Object.fromEntries(
    Object.entries(FILTERS).map(([name, patterns]) => [
      name,
      patterns.some((pattern) => changedFiles.some((file) => matches(pattern, file))),
    ]),
  );

/**
 * Evaluate a job `if:` that is a pure OR-chain of `needs.changes.outputs.X == 'true'`.
 * THROWS on any other shape — a silent wrong answer here is the defect this file exists for, so an
 * unsupported condition must fail loudly rather than default to true or false.
 */
const TERM = /^needs\.changes\.outputs\.([A-Za-z_]\w*)\s*==\s*'true'$/;
const evalCondition = (expr, categories) => {
  if (expr === undefined) return true; // no `if:` — gated only by `needs:`
  const terms = expr.replace(/\s+/g, ' ').trim().split('||');
  return terms
    .map((raw) => {
      const m = TERM.exec(raw.trim());
      if (!m) throw new Error(`unsupported condition shape: ${expr}`);
      const name = m[1];
      // `any` is a composed output of the `changes` job, not a filter category — resolve it recursively
      // from that job's own `outputs` map so this parser never invents a value for it.
      if (!(name in categories)) {
        const composed = jobs.changes.outputs?.[name];
        if (composed === undefined) throw new Error(`unknown output: ${name}`);
        const inner = composed.replace(/^\s*\$\{\{\s*/, '').replace(/\s*\}\}\s*$/, '');
        return evalCondition(inner.replace(/steps\.filter\.outputs\./g, 'needs.changes.outputs.'), categories);
      }
      return categories[name];
    })
    .some(Boolean);
};

/** Does `job` run for these changed files? Walks `needs:` — a skipped dependency skips the dependent. */
const runs = (jobName, categories) => {
  const job = jobs[jobName];
  if (!evalCondition(job.if, categories)) return false;
  return needsOf(job).every((dep) => runs(dep, categories));
};

// ─── the report ladder ────────────────────────────────────────────────────────────────────────────────
const reportScript = jobs['build-test'].steps
  .map((s) => s.run)
  .filter(Boolean)
  .join('\n');

const noticeLines = reportScript.split('\n').filter((l) => l.includes('::notice::'));

const noticeFor = (marker) => {
  const found = noticeLines.filter((l) => l.includes(marker));
  expect(found, `no ::notice:: line containing "${marker}"`).toHaveLength(1);
  return found[0];
};

// One representative changed-file set per ladder branch. The category vector each produces is asserted
// below, so the mapping from shape to branch is checkable against the shell `if` ladder rather than
// taken on trust — and the branch-completeness assertion catches a sixth branch appearing.
const SHAPES = [
  { marker: 'citation-surface-only change', files: ['iac/main.tf'] },
  // `docs/adr/README.md`, NOT a `NNNN-….md` name: the ADR citation gate in this same suite reads any
  // `docs/adr/\d{4}-….md` string as a CITATION and fails when the record does not exist. A made-up
  // `0001-example.md` fixture here turned that gate red — correctly. This path matches `docs/adr/**`
  // for the filter, is a real file, and is invisible to that regex. Do not "simplify" it back.
  { marker: 'docs/adr or deploy.yml-only change', files: ['docs/adr/README.md'] },
  { marker: 'VERSION-only change', files: ['VERSION'] },
  { marker: 'CLAUDE.md-only change', files: ['CLAUDE.md'] },
  { marker: 'no gated changes', files: ['LICENSE'] },
];

describe('app.yml — npm-audit is not gated on the diff', () => {
  it('carries no `if:` at all, so no path filter can make it inert', () => {
    // The exact regression this pins: `if: needs.changes.outputs.code == 'true'`, which produced six
    // unmeasured greens. Any `if:` here is either a narrowing of npm-ci's condition or a copy that drifts.
    expect(npmAudit.if).toBeUndefined();
  });

  it('depends on npm-ci and on nothing else, so "whenever the tree is installed" is stated once', () => {
    expect(needsOf(npmAudit)).toEqual(['npm-ci']);
  });

  it('is not reachable on strictly fewer triggers than the install it depends on', () => {
    expect(npmCi.if).toContain('needs.changes.outputs.test');
    expect(npmCi.if).toContain('needs.changes.outputs.version');
    expect(npmCi.if).toContain('needs.changes.outputs.citations');
    expect(npmAudit.if ?? null).toBeNull();
  });

  it('still runs the blocking audit command and still feeds the required check', () => {
    const runSteps = npmAudit.steps.map((s) => s.run).filter(Boolean);
    expect(runSteps).toContain('npm run audit');
    expect(needsOf(jobs['build-test'])).toContain('npm-audit');
  });

  it('has its own guard reachable — app.yml is in the `test` filter that gates vitest', () => {
    // Asserted against the filter body, not the header comment. Without this entry the whole file is
    // correct and never runs on its own trigger.
    expect(FILTERS.test).toContain('.github/workflows/app.yml');
    expect(runs('vitest', categoriesFor(['.github/workflows/app.yml']))).toBe(true);
  });
});

describe('app.yml — every filter pattern is a form the matcher below actually implements', () => {
  it('uses only prefix / rootmd / exact forms', () => {
    // If this reddens, DO NOT relax it: teach `matches()` the new form and re-verify it against
    // picomatch first. A matcher that silently mishandles a form makes every derivation below wrong.
    const unknown = Object.entries(FILTERS).flatMap(([cat, patterns]) =>
      patterns.filter((p) => formOf(p) === null).map((p) => `${cat}: ${p}`),
    );
    expect(unknown).toEqual([]);
  });

  it('places CLAUDE.md in `citations` and in no other category but `harness`', () => {
    // This is the fact the first version of this file got wrong. Derived, so it cannot go stale silently.
    const cats = categoriesFor(['CLAUDE.md']);
    expect(cats).toEqual({
      code: false,
      test: false,
      harness: true,
      version: false,
      citations: true,
    });
  });

  it('leaves CLAUDE.md as the only `harness` path outside `test`', () => {
    // The gate flagged this derivation as uncorroborated, so it is computed here rather than reasoned
    // about. If a future `harness` entry lands outside `test`, the harness branch gains a second domain
    // and its notice may need different wording — this is what will say so.
    const outsideTest = FILTERS.harness.filter(
      (p) => !FILTERS.test.some((t) => matches(t, p)),
    );
    expect(outsideTest).toEqual(['CLAUDE.md']);
  });
});

describe('app.yml — the report never claims npm-audit ran where it did not, or the reverse', () => {
  it('knows every branch of the ladder, in both directions, with no count to keep in sync', () => {
    // Guards the guard, and deliberately NOT by counting: the first version of this assertion asserted
    // `SHAPES.length + 2` and was wrong, because "the app gate ran" has two variants. A literal total is
    // one more belief to hold, which is the defect this whole file was rewritten to stop encoding.
    //
    // The property instead is a PARTITION: every ::notice:: is either one of the mapped shapes, the
    // job-failed line, or a gate-ran summary — and every mapped shape is present. A branch added without
    // a SHAPES entry fails the first half; a branch deleted fails the second.
    const unmapped = noticeLines.filter(
      (l) =>
        !SHAPES.some((s) => l.includes(s.marker)) &&
        !l.includes('did NOT complete') &&
        !l.includes('the app gate ran'),
    );
    expect(unmapped).toEqual([]);
    for (const { marker } of SHAPES) expect(noticeFor(marker)).toContain('::notice::');
  });

  it.each(SHAPES)('agrees with what actually runs on $marker', ({ marker, files }) => {
    const categories = categoriesFor(files);
    const auditRuns = runs('npm-audit', categories);
    const notice = noticeFor(marker);
    // The whole property, in one line, with no belief about which side it lands on.
    expect(notice.includes('npm-audit')).toBe(auditRuns);
  });

  it('names vitest and harness-drift on the CLAUDE.md branch, both of which do run there', () => {
    // The other two claims in the corrected sentence, derived rather than trusted: `citations` starts
    // vitest (the ADR citation gate) and `harness` starts harness-drift.
    const categories = categoriesFor(['CLAUDE.md']);
    expect(runs('vitest', categories)).toBe(true);
    expect(runs('harness-drift', categories)).toBe(true);
    const notice = noticeFor('CLAUDE.md-only change');
    expect(notice).toContain('vitest');
    expect(notice).toContain('harness-drift');
  });

  it('names npm-audit in the CLAUDE.md-only notice, where npm-ci starts via `citations`', () => {
    // Kept as an explicit assertion beside the derived one: this is the exact statement that was
    // inverted, and a reader looking for it should find it spelled out rather than only computed.
    expect(noticeFor('CLAUDE.md-only change')).toContain('npm-audit');
  });

  it('does NOT name npm-audit where npm-ci is genuinely skipped', () => {
    // The `no gated changes` branch requires every category false, so npm-ci really is skipped. This half
    // of the original pair was correct and is unchanged.
    expect(runs('npm-audit', categoriesFor(['LICENSE']))).toBe(false);
    expect(noticeFor('no gated changes')).not.toContain('npm-audit');
  });
});
