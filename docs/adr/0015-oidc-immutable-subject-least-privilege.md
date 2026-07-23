# 0015. GitHub OIDC deploy roles — immutable subject, least-privilege

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0014](./0014-terraform-cloud-pipeline-only.md)

## Context & problem
CI has to touch AWS — sync the site to S3, invalidate CloudFront, run `terraform apply`. That requires
credentials. Long-lived AWS access keys stored as repo secrets are a standing liability: they leak, they
rotate, and they grant more than any one job needs.

## Decision drivers
- No long-lived secrets in the repo (ADR-0001: minimal attack surface).
- Least-privilege — each job assumes only what it needs.
- A trust that survives repo renames (learned the hard way, below).

## Considered options
1. **GitHub OIDC federation → per-job scoped roles, trust pinned to the immutable subject** (chosen) —
   each workflow assumes a role via short-lived OIDC tokens; the role trust matches
   `repo:<org>@<org_id>/<repo>@<repo_id>:*` (the ID-embedded subject GitHub now emits). *Trade-off:* the
   immutable subject is non-obvious and easy to get wrong.
2. **Long-lived AWS access keys as secrets** — *Why not:* leakable, rotation burden, over-scoped;
   precisely what OIDC removes.
3. **OIDC trust on the mutable `repo:<org>/<repo>:*` subject** — the obvious form. *Why not:* it broke
   **every** assume-role when the repo was renamed `tadeumendonca-pwa` → `tadeumendonca-io`, because the
   plain-name subject no longer matched. A real incident this ADR exists to prevent recurring.

## Decision outcome
Chosen: **OIDC with per-job least-privilege roles, trust pinned to the immutable numeric-ID subject.**
Role ARNs are environment-scoped secrets; tooling tokens are repository secrets. No AWS keys live in the
repo.

## Consequences
**Good**
- No long-lived credentials; short-lived tokens per job; least-privilege per role.
- Survives repo renames — the numeric IDs don't change when the name does.

**Bad / accepted costs**
- The immutable subject is a **trap for the unwary**: a rename that doesn't update the trust (or a trust
  written with the plain name) silently breaks every deploy with `Not authorized to perform
  sts:AssumeRoleWithWebIdentity` — the exact failure this session diagnosed.
- Role/trust changes are pipeline-only (ADR-0014), so fixing a broken trust is itself a gated change.

## Links
- Driven by ADR-0001, ADR-0014 · the immutable-subject trap is documented in project memory · role ARNs
  are environment secrets per the secret-scoping standard.
