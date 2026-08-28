# 0020. SonarCloud quality gate, blocking

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0018](./0018-ci-gates-e2e-on-pr-coverage.md)

## Context & problem
Beyond tests, the code needs an objective, enforced quality bar — bugs, code smells, security hotspots
(SAST), and coverage — that a human cannot wave through. On a public proof-of-engineering repo, "quality"
must be provable by the harness, not asserted.

## Decision drivers
- ADR-0018: gates are mechanical and blocking, not self-reported.
- SAST + maintainability enforced on new code, not just tests.
- Low cost (SonarCloud is free for public repos).

## Considered options
1. **SonarCloud quality gate, blocking** (chosen) — the scan runs inside `build-test` with
   `sonar.qualitygate.wait=true`, so a failed gate fails the check and blocks the merge. Scoped to
   `apps/fed/src` ~~only~~ **+ `apps/fed/scripts` (widened 2026-07-28, #201)**. *Trade-off:* that scope
   still leaves `iac/` and the workflows **unscanned** — a known limitation, with a comprehensive-scope
   expansion planned in the dev-loop.
2. **No quality gate** — *Why not:* smells, bugs and security hotspots accumulate with nothing enforcing
   the bar.
3. **Local-only linting** — *Why not:* not enforced (bypassable), and not SAST.

## Decision outcome
Chosen: **SonarCloud as a blocking gate on new code.** It is the authoritative quality/SAST check on the
PR. The scope is an acknowledged gap — broadening it to `iac/` and the workflows (and making that
blocking) is a dev-loop follow-up, not silently claimed as covered.

**Amendment (2026-07-28, #201) — `apps/fed/scripts` is now in scope.** The original scope was `src`
alone, which left the build tooling outside the index entirely: the blocking gate analysed **zero lines**
of `routes.mjs` (the single source of truth for every public URL), `prerender.mjs` (which produces the
served HTML and its OG tags) and `gen-sitemap.mjs` (what Google reads). Some of the most consequential
code in the repo was the code no static analysis looked at — and, unlike `iac/`, it was not recorded here
as a gap, because "src" read as "the app" rather than as "half of what ships".

The widening was **measured, not assumed**: the scanner went from 92 to 101 indexed files, exactly the 9
files in that directory. The first scan to ever see them found two `S1121` code smells, which were fixed
at cause rather than suppressed — the gate's first honest report on that code.

*Consequence worth recording:* four of those scripts have no tests, so `main`'s **overall** coverage
number drops when they enter the index. Nothing breaks — every gate condition is `new_*` — and the lower
number is the accurate one. It should not be read as a regression.

**Amendment (2026-08-27, #542) — `src/data/profile.ts` joins `sonar.cpd.exclusions`.** The exclusion
list was scoped, in as many words, to *"the two list files — NOT src/data/\*\*"*. This adds a third
named file to it. Recorded here rather than as a new record because the *scope of what the blocking
gate analyses* is part of this ADR's own decision — which is the same reason #201 amended this record
instead of opening another.

*The measurement, because it is the argument and not an illustration of it.* On PR #552 the gate
reported `new_duplicated_lines_density` **18.1%** against a 3% condition — 19 duplicated lines of 105
new. One CPD pair, both halves inside `apps/fed/src/data/profile.ts`:

```
curl -s "https://sonarcloud.io/api/duplications/show?key=tedeuxx_tadeumendonca-io%3Asrc%2Fdata%2Fprofile.ts&pullRequest=552"
→ blocks: {from 103, size 46} · {from 262, size 50}
```

Those are the `description` object and the head of `highlights` on the **2023-04** and **2015-01**
experience entries. Every token in both blocks is a field name from `ProfileSource`, a `+`, or a string
literal — **not one line in either block is executable.** The two blocks' prose has nothing in common;
they matched because **CPD normalises string literals**, which is the whole finding.

**That normalisation is why the exclusion is right on its own terms and not because a PR was blocked.**
On a module that is nothing but authored prose, CPD is *structurally incapable* of finding the only
defect worth catching there — two roles carrying the **same words** would normalise to exactly the same
token stream as two roles carrying entirely different ones, so it cannot see it — while firing reliably
on the one thing that is by design: two roles carrying the same **schema**. The coverage given up is
coverage of nothing. The rest of `src/data/**` is untouched, so `resolveProfile.ts` and every other
module with real logic keeps CPD; the list stays file-enumerated rather than becoming a glob, which is
the property the original scoping sentence was protecting.

*The second measurement, which settles the third option.* The same two entries carry the same shape on
`main`, and there the file measures `duplicated_lines_density` **0.0**
(`/api/measures/component?component=…%3Asrc%2Fdata%2Fprofile.ts&branch=main`). Nothing structural
changed in this diff — what moved the metric is **where sentences happened to wrap into `+`-joined
fragments** under the formatter. So "reword the entries until they stop matching" is not a fix with a
stable result: it is a request that published copy be chosen to satisfy a line-wrapping accident, and it
would have to be redone on every content pass, in a file whose entire purpose is to be edited as prose.

### Considered options

1. **Add `src/data/profile.ts` to `sonar.cpd.exclusions`** (chosen). *Trade-off, stated plainly and not
   minimised:* an exclusion is permanent and silent, and `profile.ts` is the file every future
   experience entry lands in — so a genuine copy-paste there is never caught by this instrument again.
   Accepted because, per the normalisation argument above, this instrument could not have caught it.
2. **Loosen the duplication condition on the quality gate.** *Why not:* it buys the same green by
   lowering the bar for every file in the project instead of naming one file and why. Strictly worse
   than option 1 on every axis, and it is the shape of change this repo's own gate policy exists to
   refuse.
3. **Restructure the two entries so they are not token-identical.** *Why not:* it is the only option
   that keeps the instrument pointed at the file, which is why it was weighed rather than dismissed —
   but the `main`-measures-0.0 result above shows the outcome is a function of the formatter, so the
   fix has a negative half-life and the price is paid in published copy. Changing what the CV *says* to
   change what a detector *counts* also inverts which of the two is authoritative.
4. **Move the entries to JSON outside `sonar.sources`.** *Why not:* strictly wider than option 1 — it
   removes the file from **all** analysis rather than from CPD alone — and it costs the compile-time
   schema enforcement `const sourceTemplate: ProfileSource` gives the content today. Trading a real
   safety property for a metric is the wrong direction.
5. **Accept the red.** *Why not:* the gate is blocking and the merge is the deploy; there is no state
   in which this is a decision rather than a stall.

*Consequence worth recording, and it is the one to watch:* this is now the **third** file admitted, so
the list is close to reading as a habit rather than a set of individual judgments. The narrower rule
written beside the config — the file must be authored content under a type the compiler still enforces,
**and** CPD must be structurally unable to find the defect you would actually want caught there — is
what a fourth candidate has to clear. A file whose entries are data but whose duplication would be
**real** does not qualify.

## Consequences
**Good**
- SAST + coverage + maintainability enforced mechanically; a red gate blocks the merge.
- Free for public repos; no infra.

**Bad / accepted costs**
- **Scoped to `apps/fed/src` + `apps/fed/scripts`** — `iac/` and `.github/workflows` are still not
  scanned (the workflow SonarLint findings from the ADR's own session, e.g. action SHA-pinning, were
  never CI-enforced for this reason). The `scripts` half of this gap was closed by #201; what remains is
  the two directories named here.
- An external dependency (SonarCloud availability) sits in the gate.
- **Three files are outside CPD** (`src/data/catalog.ts`, `src/data/repoCards.ts`, and — since #542 —
  `src/data/profile.ts`). Real copy-paste in any of them is not caught by this gate. The argument for
  each is beside the config and, for the third, in the 2026-08-27 amendment above; the entry rule for a
  fourth is written there too, because a list like this decays into a habit if it is only ever added to.

## Links
- Driven by ADR-0001, ADR-0018 · it is the quality half; the security posture is ADR-0021 · scope
  expansion is a dev-loop follow-up.
