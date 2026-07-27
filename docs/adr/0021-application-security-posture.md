# 0021. Application security posture — SAST + package-vulnerability scanning

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
The infra security posture (ADR-0017) is minimal because the surface is minimal. The same question at the
**application** level: what security controls does a static SPA with no server, no auth and no user data
actually need? Being backendless removes whole classes of concern (injection into a DB, auth bypass,
server RCE, secrets at runtime) — what remains is the client bundle and its **dependencies**.

## Decision drivers
- ADR-0002: no server-side attack surface — most AppSec controls have nothing to act on.
- ADR-0001: apply only the controls with a real threat here.
- The realistic risks for a static bundle are code-level defects (SAST) and vulnerable dependencies.

## Considered options
1. **SAST + package-vulnerability scanning** (chosen) — SonarCloud (ADR-0020) covers SAST/security
   hotspots; a dependency-vulnerability scan (Dependabot / `npm audit`) covers vulnerable packages.
   Together with the infra floor (OIDC least-privilege ADR-0015, no secrets in the repo, the `PreToolUse`
   guard hook) this is the whole posture — ~~two levers~~ **three, see the amendment (2026-07-27): the
   enumeration was incomplete, install-time script execution is a distinct lever.** *Trade-off:* scoped
   to a static bundle; a future dynamic surface needs more.
2. **Heavier AppSec (DAST, pentest, runtime WAF rules)** — *Why not:* there is no dynamic/authenticated
   surface to test or protect; it would be controls without a target.
3. **SAST only** — *Why not:* leaves the most realistic static-site risk — a known-vulnerable dependency
   shipped in the bundle — uncovered.

## Decision outcome
Chosen: **SAST (SonarCloud) + package-vulnerability scanning**, on top of the infra least-privilege floor.
This is calibrated to what a backendless site can actually be attacked through: its code and its deps.

**Package-vulnerability scanning — mechanism (delivered by Issue #52):** two complementary levers.
- **Enforcement** — a **blocking `audit-ci` step in `build-test`** (`apps/fed/audit-ci.jsonc`, run via
  `npm run audit`), placed right after `Install` so a vulnerable dep aborts before the E2E + Sonar steps.
  **Threshold: block on HIGH + CRITICAL advisories in PRODUCTION dependencies only** (`skip-dev`). A static
  site ships only its prod deps in the bundle; a build-tool devDependency advisory never reaches a user, so
  it is reported (Dependabot) but does not block the deploy — controls calibrated to the real threat (ADR-0001).
- **Hygiene** — **Dependabot** (`.github/dependabot.yml`, npm ecosystem on `apps/fed`, weekly, grouped
  minor/patch) for scheduled update PRs plus GitHub-native vulnerability alerts / security-update PRs.
- **Triage** — a genuine unreachable / false-positive advisory goes into the checked-in `audit-ci.jsonc`
  **allowlist with a written justification and a review/expiry date**; removing an entry re-blocks the gate.
  Never a silent skip or `|| true` — the gate is not gamed (consistent with ADR-0020's blocking-gate posture).

## Consequences
**Good**
- Security effort matched to the real surface — no theatre, no idle controls.
- Being backendless is a *security* win, not just a cost one: whole vulnerability classes are absent.

**Bad / accepted costs**
- ~~**Known gap:** package-vulnerability scanning is not yet implemented.~~ **RESOLVED (Issue #52):** both
  levers shipped (blocking `audit-ci` gate in `build-test` + Dependabot). The floor ADR-0021 named is now
  whole.
- **Live-advisory-DB gate cost (accepted):** the audit queries a live advisory database, so a previously-green
  required `build-test` check can start blocking an *otherwise-unrelated* code PR the day a new advisory lands
  against an existing prod dep. That is inherent to the control (and the point of it); the checked-in allowlist
  with expiry is the pressure-relief valve, and a real advisory is fixed by a dep bump, not by widening the gate.
- Calibrated to static: a dynamic/authenticated surface would reopen the AppSec concerns ADR-0002 closed.

## Amendment (2026-07-27) — supply-chain execution control: `npm ci --ignore-scripts`
**Every CI dependency install runs `npm ci --ignore-scripts`** (today `.github/workflows/deploy.yml` and
`.github/workflows/build-test.yml`). This is a **third** lever, and the decision above was wrong to call
two the whole posture.

**Why it is not already covered.** `audit-ci` blocks *known-vulnerable packages that ship in the bundle*;
this blocks *arbitrary code execution at install time* by **any** package, vulnerable or not — including
the devDependencies `audit-ci.jsonc`'s `skip-dev` deliberately ignores. A brand-new malicious release has
no advisory to match, and a build-tool dep never reaches a user's browser yet still runs code on the
runner. Different threat, different control.

**Why it matters here, precisely — and stated correctly, because the first draft of the workflow comment
was not.** In `deploy.yml` the install runs **before** `Configure AWS credentials`, so the threat is
**persist-then-execute**, not "the install holds credentials": a malicious `postinstall` writes into
`node_modules`, and the later `npm run build:static` executes that tree with the OIDC deploy role in the
job environment — rights to write S3 and invalidate CloudFront (`id-token: write` is job-wide from step
one regardless). In `build-test.yml` the point is different and does not involve credentials at all: the
gate installs the dependency tree of **a branch anyone can open**, before any gate has inspected the diff.

*Trade-off (accepted deliberately):* a future dependency that genuinely needs a lifecycle hook must get an
**explicit, reviewed step** instead of an implicit one. That is friction on a rare path, bought in
exchange for no unreviewed code running on a runner that later touches the deploy role.

*Alternative considered, rejected for now:* `apps/fed/.npmrc` with `ignore-scripts=true` — this would make
the invariant a **property of the repo** rather than two hand-edited workflow lines, covering Dependabot
and local installs too. *Why not now:* it also silences hooks in **local dev**, where a future dependency
needing one fails confusingly and far from its cause. Revisit if a third install site appears or the two
workflow lines drift.

## Links
- Driven by ADR-0001, ADR-0002 · SAST is ADR-0020 · infra floor is ADR-0015, ADR-0017 · package-vulnerability
  scanning (Dependabot + `audit-ci`) delivered by Issue #52 · the `--ignore-scripts` amendment delivered by
  Issue #192 (PR #194); the deploy role it protects is ADR-0015, the gates it runs in are ADR-0018.
