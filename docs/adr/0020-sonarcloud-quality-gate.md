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
   `sonar.qualitygate.wait=true`, so a failed gate fails the check and blocks the merge. Scoped today to
   `apps/fed/src` (`projectBaseDir` + `sonar.sources`). *Trade-off:* that scope leaves `iac/` and the
   workflows **unscanned** — a known limitation, with a comprehensive-scope expansion planned in the
   dev-loop.
2. **No quality gate** — *Why not:* smells, bugs and security hotspots accumulate with nothing enforcing
   the bar.
3. **Local-only linting** — *Why not:* not enforced (bypassable), and not SAST.

## Decision outcome
Chosen: **SonarCloud as a blocking gate on new code.** It is the authoritative quality/SAST check on the
PR. The current `apps/fed/src` scope is an acknowledged gap — broadening it to `iac/` and the workflows
(and making that blocking) is a dev-loop follow-up, not silently claimed as covered.

## Consequences
**Good**
- SAST + coverage + maintainability enforced mechanically; a red gate blocks the merge.
- Free for public repos; no infra.

**Bad / accepted costs**
- **Scoped to `apps/fed/src`** — `iac/` and `.github/workflows` are not scanned today (the workflow
  SonarLint findings this session, e.g. action SHA-pinning, were never CI-enforced for this reason).
- An external dependency (SonarCloud availability) sits in the gate.

## Links
- Driven by ADR-0001, ADR-0018 · it is the quality half; the security posture is ADR-0021 · scope
  expansion is a dev-loop follow-up.
