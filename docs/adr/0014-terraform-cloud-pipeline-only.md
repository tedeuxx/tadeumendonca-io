# 0014. Terraform + Terraform Cloud, apply pipeline-only

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0003](./0003-trunk-based-single-environment.md)

## Context & problem
The frontend infrastructure (ADR-0013 and the rest) is code. That code needs somewhere to keep state and
locks, and a rule for **who is allowed to run `apply`**. On a public, agent-driven repo, an agent (or a
laptop) running `terraform apply` against live AWS is exactly the irreversible, off-git boundary the
whole delivery model guards.

## Decision drivers
- ADR-0003: the merge is the go/no-go; infra changes should ride the same gate.
- No local drift, state locking, an audit trail.
- The agent works the inner loop but must not mutate cloud state directly.

## Considered options
1. **Terraform state in Terraform Cloud, Local execution, apply pipeline-only** (chosen) — TFC holds
   state + locks; execution mode is **Local**, so GitHub Actions runs `plan`/`apply`; a reviewed `plan`
   on the PR, `apply` on merge, in CI only. *Trade-off:* a merge that touches `iac/` applies real AWS
   infra, so the plan must be read before merging.
2. **Local state + local `apply`** — *Why not:* no locking, no audit, drift between machines, and it puts
   irreversible cloud mutation in the inner loop.
3. **TFC remote execution** — TFC's own runners run Terraform. *Why not:* the runners need standing cloud
   credentials; Local execution + GitHub OIDC (ADR-0015) is fewer moving parts and no stored keys.

## Decision outcome
Chosen: **TFC for state/locks, Local execution, apply pipeline-only.** `fmt`/`validate`/inspection `plan`
are fine locally and in the inner loop; `apply`/`destroy` run only in CI on a merge. This makes cloud
mutation an outer-loop, human-gated act — consistent with ADR-0003 and enforced by the permission floor.

## Consequences
**Good**
- Locked, audited, reproducible state; no local drift.
- No irreversible cloud mutation in the inner loop — `apply` is CI-only, on a confirmed merge.

**Bad / accepted costs**
- A merge touching `iac/` applies real infrastructure — the plan on the PR must be read, not rubber-stamped.
- A dependency on Terraform Cloud (the workspace name is load-bearing — renaming it points Terraform at
  empty state; kept deliberately as-is).

## Amendment (2026-08-03) — the floor has one exception, and it was never recorded here
The decision above is unchanged: `apply`/`destroy` still run in CI only, and no `terraform apply` has ever
run outside it. What is **narrowed** is the Consequences → Good claim *"No irreversible cloud mutation in
the inner loop"*.

That claim is true of Terraform and false of the account. The GitHub OIDC provider, the infra role CI
assumes to run Terraform, and that role's managed policy are **not** managed by `iac/` — they are created
by hand with the AWS CLI, because the first run would otherwise need the credential it has not created
yet, and because a role able to rewrite its own trust policy has no ceiling on it. So there is
human-performed, irreversible-class cloud mutation at t = 0, and again whenever that policy is revised.

Recorded in full — both reasons, the scope of the exception, and the fact that nothing enforces removing
the bootstrap credentials — in **[ADR-0042](./0042-trust-root-bootstrapped-out-of-band.md)**. A reader of
0014 alone would take "pipeline-only" as total; it is total *for Terraform*, and that is a narrower
statement than it looks.

## Amendment (2026-09-14) — the plan does not run on a Dependabot PR, and that is a SECOND exception

The decision above is unchanged: `apply`/`destroy` still run in CI only. The 2026-08-03 amendment
narrowed a Consequences → **Good** claim. This one narrows a Consequences → **Bad** claim, which is the
one that reads as a safeguard:

> *"A merge touching `iac/` applies real infrastructure — the plan on the PR must be read, not
> rubber-stamped."*

**On a Dependabot-triggered PR there is no plan to read.** GitHub gives such a run its own secret store,
and this repository has not populated it, so `AWS_INFRA_OIDC_ROLE_ARN` (an environment secret under
`staging`), `TFC_API_TOKEN` and `BUDGET_ALERT_EMAIL` are all empty and `configure-aws-credentials` fails
client-side with *"Could not load credentials from any providers"* **before any `AssumeRoleWithWebIdentity`
call is ever made** — so this was never an OIDC-trust or IAM defect. The runner declares the store itself,
in one line of its own log, and that is the falsifier to use rather than inferring it from two secrets
being empty together:

```
gh run view --repo tedeuxx/tadeumendonca-io --job <job-id> --log | grep -m1 'Secret source'
# on a Dependabot-triggered run -> Secret source: Dependabot
# on any other run              -> Secret source: Actions
```

**`.github/workflows/iac.yml` now skips the five credential-dependent steps when
`github.actor == 'dependabot[bot]'`** — the owner's ruling of 2026-09-11. The alternative, adding the
secrets to the Dependabot store, was **refused on the record**: it widens where an OIDC role ARN is
readable, which is a security decision rather than a mechanical fix. `pull_request_target` is the same
security class and is refused with it.

### Why the condition is on the STEPS and not on the job

`terraform-plan` is the required check, and **a skipped required check satisfies branch protection** —
`iac.yml`'s own job header has said so since #79. A job-level actor test would conclude the check
`SKIPPED`, satisfy protection, and unblock the merge with nothing having reported: the defect, delivered
by the fix. It is not on the `changes` path filter either — that filter answers *what changed* and the
actor is *who* — and flipping its output would corrupt the report step and diverge from `deploy.yml`'s
parallel filter.

### The blast radius, BOUNDED — and it is not the obvious one

The intuitive cost — *an unreviewed Terraform diff could merge* — describes an **empty class**.
Dependabot cannot open a PR touching `iac/` under the current configuration: `.github/dependabot.yml`
declares npm on `/apps/fed` and github-actions on `/`, and `iac/` holds no `package*.json`, no workflow
and no `action.y*ml` (only `.checkov.yaml`, which no ecosystem scans). Over every Dependabot PR ever
opened here:

```
gh pr list --repo tedeuxx/tadeumendonca-io --state all --limit 200 --author app/dependabot \
  --json number,files --jq '[.[]|{n:.number,paths:[.files[].path]}]
   | {prs:length,
      touching_iac_dir:[.[]|select(.paths|map(startswith("iac/"))|any)]|length,
      touching_filtered_workflows:[.[]|select(.paths|map(.==".github/workflows/iac.yml"
                                   or .==".github/workflows/deploy.yml")|any)]|length}'
# -> {"prs":18,"touching_iac_dir":0,"touching_filtered_workflows":5}
```

The `0` is calibrated by the `5` beside it: the selector distinguishes, so the zero is a real zero.

**What is ACTUALLY lost is narrower and sharper: this repository's only PR-time proof that the OIDC
credential chain still works.** `configure-aws-credentials` has three call sites — one in `iac.yml`'s
`terraform-plan`, and two in `deploy.yml` (`terraform-apply`'s infra role, and the fed deploy role).
**The `deploy.yml` pair only executes on push to `main`, i.e. after the merge, by construction.** So
`terraform-plan` is the sole PR-time exercise of that action, and because the `actions` Dependabot group
bumps all three together it is the de-facto canary for the production deploy path.

**Skip the plan and an action bump that breaks assume-role merges green and first fails on the trunk.**
That is #101's recorded failure — `configure-aws-credentials` v6 breaking assume-role, caught RED on the
PR before any merge — arriving one stage later, and on `main`.

### The history, because the diagnosis was paid for three times

| PR | opened | fate | `terraform-plan` |
|---|---|---|---|
| **#414** | 2026-08-09 | closed 2026-08-21, **re-authored by hand as `76f3910`** | fail |
| **#534** | 2026-08-27 | closed 2026-09-03 when #587 superseded it | fail |
| **#587** | 2026-09-03 | open, blocked 11 days | fail |

`76f3910`'s commit body already contains this entire diagnosis, including that
`gh secret list --app dependabot` returns nothing. **So the failure was correctly diagnosed on
2026-08-21, paid for by hand, and recorded nowhere anybody would meet it again.** #534 then hit it and
nobody read the red — Dependabot's own supersede behaviour closed the PR and disposed of the evidence.
**That is the failure this amendment exists to prevent, more than the stuck check is.**

### What a maintainer does when a real plan IS wanted — measured, not read

**Push a commit to the Dependabot branch.** That fires `pull_request: synchronize` with a human actor and
`Secret source: Actions`, so every gated step runs. *Permanent cost:* pushing to a Dependabot branch makes
Dependabot stop managing that PR — no further rebases.

**The re-run button is NOT the route, and this was measured rather than reasoned from documentation.**
Re-running run `34519358480` as a maintainer produced attempt 2 with `Secret source: Dependabot`
(2026-09-14) — `github.actor` stays the actor of the initial run; `github.triggering_actor` is the
re-runner. Independently, a re-run replays the workflow file from the original run, so even after this
lands a re-run of a pre-fix run uses the pre-fix `iac.yml`. **`workflow_dispatch` is not an option
either:** `iac.yml` is `on: pull_request` only, and a dispatch carries no `github.event.pull_request`, so
the `changes` job, the comment step and the required-check identity all break.

### The residual — nothing enforces any of this

**The skip is invisible in the check state, and no check state can carry it.** A skipped job concludes
`SKIPPED`; a skipped *step* concludes `SUCCESS`. Neither means *"ran and verified nothing"*, and both
render as fine beside the other checks. So the signal lives in two artifacts a human reads — a
`::warning::` annotation from `Report what was verified`, and a PR comment under the plan's own marker
saying no plan was produced — **and a human reading them is the whole of the control.**

`tadeumendonca-io` has no `hooks/` directory and registers no `PreToolUse`/`Stop` hook. No CI arm observes
a Dependabot PR merging without a plan, and none can: the merge is a human act on a green required check.
`actionlint` proves the new `if:` expression *parses*; nothing proves it is *right*. **By this loop's own
test — would something stop me, or only my memory? — every part of this is an instruction.**

**And one direction of the change cannot be proven at review time.** The implementing PR edits
`.github/workflows/iac.yml`, which the filter includes, and its author is human — so it proves the
POSITIVE direction for free (all five steps must run and a plan comment must appear on its own PR). The
negative direction is provable only after merge, on #587's next run, with the `Secret source` grep above.
**A green review does not mean it was checked.**

### One decision deliberately NOT taken here

**May a Dependabot PR bumping an action on the OIDC path merge on a skipped plan, or is it re-authored by
hand as #414 was?** #587 is exactly that case. The `#414 -> 76f3910` precedent says by hand, and what that
cost is in that commit's body: every SHA re-resolved from upstream tags, every `# vX.Y.Z` pin comment
re-verified (that pass found one already lying), and the loss of Dependabot's automatic pin-comment
rewrite. **Do not pay it by default.** The question is the owner's and is recorded here so it does not
die with a dispatch.

## Links
- Driven by ADR-0001, ADR-0003 · relies on ADR-0015 (OIDC, no stored keys) · IaC is pipeline-only, part
  of the permission floor · **the one exception to the APPLY floor is [ADR-0042](./0042-trust-root-bootstrapped-out-of-band.md)**
  (the trust root is bootstrapped out of band). **The one exception to the PLAN-IS-READ claim is the
  2026-09-14 amendment above** — a Dependabot-triggered PR produces no plan at all. Two different
  claims, two different exceptions; before 2026-09-14 this line said *"its one exception"* and
  there genuinely was only one.
