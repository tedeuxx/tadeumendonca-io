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

## Links
- Driven by ADR-0001, ADR-0018 · it is the quality half; the security posture is ADR-0021 · scope
  expansion is a dev-loop follow-up.
