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

## Links
- Driven by ADR-0001, ADR-0003 · relies on ADR-0015 (OIDC, no stored keys) · IaC is pipeline-only, part
  of the permission floor.
