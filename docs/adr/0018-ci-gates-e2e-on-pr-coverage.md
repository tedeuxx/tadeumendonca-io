# 0018. CI gates on the PR — E2E included, unit coverage ≥85%

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0003](./0003-trunk-based-single-environment.md)

## Context & problem
Trunk-based, single-environment delivery (ADR-0003) has **no staging tier** to catch a bad change before
it is live — the merge is production. So the PR gate is the *only* place verification happens; anything
not checked there is not checked at all.

## Decision drivers
- ADR-0003: no downstream tier — the PR carries the whole gate.
- A route break must fail *before* it deploys, not after.
- The gate must be mechanical and blocking (agent-provable, not self-reported).

## Considered options
1. **Full gate on the PR** (chosen) — `build-test` runs lint + typecheck + unit tests (coverage **≥85%**)
   + build + **E2E against a preview of the build** + the SonarCloud gate; `infra-plan` runs checkov +
   `plan` for `iac/`. All blocking, on every PR to `main`. *Trade-off:* the PR is slower (a full E2E +
   Sonar run per PR).
2. **Defer E2E to post-deploy** (the old two-environment habit) — *Why not:* on a single-env repo the
   change is already live when E2E runs; a break reaches production first. This session moved E2E onto
   the PR for exactly this reason.
3. **Minimal gate (lint + unit only)** — *Why not:* insufficient when there is no staging net; route/
   integration breaks would ship.

## Decision outcome
Chosen: **the full gate runs on the PR**, E2E included, coverage ≥85%. Post-deploy E2E remains only as a
smoke against the real CDN (ADR-0023). ~~The merge stays the human go/no-go (ADR-0003).~~ **Amended
2026-07-23:** the merge's go/no-go is held by the `critical-reviewer`, which escalates the boundary class
to the owner — see the amendment on [ADR-0003](./0003-trunk-based-single-environment.md). Note the
division of labour that makes this work: **CI proves nothing broke; the reviewer judges whether the change
is right.** A green pipeline is not the review, and treating it as one is how the review gets skipped.

## Consequences
**Good**
- A break fails the PR, not the live site — the missing staging tier is compensated at the gate.
- Everything is mechanical and blocking; "done" is provable without a human re-checking.

**Bad / accepted costs**
- The PR is slower — a full E2E + Sonar run on every PR.
- The gate must stay comprehensive; a check dropped here has no downstream backstop (ADR-0019).

## Amendment (2026-07-23) — a third gate, and what "blocking" actually requires
The gate set gains **`lint-workflows`**: `actionlint` + `shellcheck` over `.github/workflows/**`.

It exists because the decision above had a hole. "All blocking, on every PR" was true of the two gates
named, and **workflows themselves were covered by neither** — `build-test` is path-filtered to
`apps/fed`, so a workflow-only change matched nothing and reported **PASS**. A green check that
verified nothing, indistinguishable from one that verified everything. That is how an un-executed
retry loop reached the production release path (#79), and `actionlint` sat in the permission allowlist
without being wired into any job.

**The mechanical detail worth recording, because the first attempt got it wrong:** a workflow with a
top-level `paths:` filter on `pull_request` **cannot be a required status check**. On a PR that does
not match, the check never reports and stays pending forever, so branch protection can never require
it. A filtered workflow is therefore permanently *advisory* — which would have added a third gate in
name while leaving the decision above unmet. Every gate here runs on **every** PR and applies its path
filter **inside** the job (the shape `build-test` already used, for exactly this reason).

**Corollary, applied to all three:** each job ends with a `::notice::` naming which of **three** cases
occurred — *nothing matched the filter, so nothing was verified* · *a step failed, so the checks after
it never ran* · *the gate ran, with the list*. "Blocking" is not sufficient if a skipped run is
indistinguishable from a verified one; that ambiguity is what let "build-test is green" be read as
assurance it had not given.

The failure branch is not decoration. A notice that prints the full list after an early step failed
overstates what ran — the same defect on the red path instead of the green one — and the first draft
here did exactly that. `infra-plan` was also asserted to have this behaviour before it did: on the PR
that introduced the corollary, `plan` reported **pass in 15s** having run neither checkov nor
`terraform`, while this ADR already claimed otherwise. **An ADR that overstates what was implemented
is the durable form of the defect the corollary exists to remove**, which is why the mismatch is
recorded rather than quietly corrected.

*Also recorded:* `actionlint` silently disables `shellcheck` when the binary is absent, halving the
check and still exiting 0 — and passing `-shellcheck <path>` does **not** change that (verified: an
invalid path still just disables the rule). The job asserts the executable itself before trusting the
result.

## Amendment (2026-07-28) — gate ownership is by WHAT a file is, not by which directory it sits in
The chosen option splits the gates by path: `build-test` for the app, `infra-plan` (checkov + `plan`) for
`iac/`. That reads as a directory rule, and one file breaks it.

`iac/cloudfront-functions/spa-rewrite.js` lives under `iac/` because Terraform ships it
(`frontend.tf` reads it with `file()`), but it is **behaviour, not infrastructure** — it is what turns an
advertised slash-less URL into its prerendered artifact. `infra-plan` validates that the Terraform is
well-formed and plannable; it cannot say whether the function *routes correctly*. So under a strict
directory rule the one file in `iac/` whose correctness is a runtime behaviour had **no behavioural gate
at all** — the position #205 was filed for, and the last unguarded link in #200's chain.

**Narrowed:** the division is by what a file *is*. Terraform is gated by `infra-plan`; a
**behaviour-bearing file under `iac/`** is additionally unit-gated by `build-test`, whose filter now
includes `iac/cloudfront-functions/**`. The two are complementary: they assert **different** properties of
the same file, so **neither one's green covers the other's** — which is why both are named here rather
than one being treated as sufficient. A green `infra-plan` on this file means the Terraform is valid, and
nothing about whether the function routes correctly; that gap is the whole reason #205 existed.

*Trade-off (accepted):* two workflows now fire on one path, which costs a little CI time and means a
reader must know both gates exist to know what covered a change. The alternative was leaving a file whose
regression would silently revert #200 — every advertised URL serving the home page's OG card — guarded by
a `plan` that never executes it.

*Limit worth stating:* the unit test proves behaviour under Node, **not** acceptance by the CloudFront
Functions JS 2.0 runtime. A rewrite using `?.`, `??` or `const` would pass green and be rejected at
`aws_cloudfront_function` create time — i.e. in `infra-apply`, after the merge. The gate narrows the
failure window; it does not close it.

## Links
- Driven by ADR-0003 · the regression it runs is ADR-0019 · the quality gate is ADR-0020 · post-deploy
  smoke is ADR-0023 · the loop model is the plugin's `trunk-single-env`.
- Amended by issue #205 (PR #215) — behaviour-bearing files under `iac/` are unit-gated by `build-test`.
