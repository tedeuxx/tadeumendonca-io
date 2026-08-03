# 0042. The trust root is bootstrapped out of band — Terraform never manages the OIDC provider, nor the role that runs Terraform

- **Status:** accepted
- **Date:** 2026-08-03
- **Deciders:** the owner
- **Driven by:** [ADR-0014](./0014-terraform-cloud-pipeline-only.md), [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md)

## Context & problem
ADR-0014 puts `apply`/`destroy` in the pipeline and nowhere else. ADR-0015 says the pipeline gets its
credentials by assuming an OIDC role rather than by holding a key. Both are true, and both **presuppose
something neither of them creates**: a GitHub OIDC identity provider in the account, and an *infra* role
(`AWS_INFRA_OIDC_ROLE_ARN`) that CI assumes in order to run Terraform at all.

What `iac/` actually manages, verified in the code rather than inferred:

- `iam.tf` creates the **fed deploy** role (`module.oidc_fed`) and its scoped policy
  (`module.policy_fed_deploy`), and publishes the role ARN to SSM. That is the role that *publishes the
  site*.
- There is **no** `aws_iam_openid_connect_provider` resource anywhere in the root module. The
  `iam-assumable-role-with-oidc` module composes the provider ARN as a string
  (`arn:<partition>:iam::<account>:oidc-provider/${provider_url}`), so the provider must already exist for
  the role's trust policy to reference anything real.
- There is **no** resource for the infra role or for its managed policy `tadeumendonca-iac-deploy`. That
  policy exists in this repo only as a desired-state document, `docs/iac-deploy-policy.{md,json}`, applied
  by hand via the AWS CLI.

So the account has a small **trust root** — provider, infra role, infra policy — that is deliberately
outside Terraform. The reasoning has been public on `/architecture` since that page shipped, but it has
never been a decision *record*, which means the walkthrough moving to the READMEs (#318) would have taken
the only written form of it with it. `README.md` already names this ADR as owed.

## Decision drivers
- **ADR-0014's floor:** cloud mutation is a pipeline act, not an inner-loop one. Any exception must be
  bounded and written down, not discovered.
- **ADR-0015's floor:** no long-lived AWS credentials anywhere in the delivery path.
- **A bootstrap constraint:** the first `terraform apply` of a config that creates the CI credential would
  need that credential to run.
- **A ceiling on the role that holds the most privilege:** the infra role can create and modify IAM. If it
  managed itself, its own trust policy and its own constraining policy would be inside its blast radius.
- **What is not managed by Terraform must be documented and auditable**, since `plan` will not describe it.

## Considered options
1. **The trust root lives outside Terraform, permanently, created by hand and documented** (chosen) — the
   OIDC provider, the infra role and `tadeumendonca-iac-deploy` are created by the owner with the AWS CLI
   once, before the first CI run; `iac/` manages everything downstream of them, including the fed deploy
   role. *Trade-off:* there is a real moment where a human mutates IAM from a laptop with credentials wide
   enough to create an identity provider, and the exception is enforced by convention rather than by a
   check.
2. **Terraform manages the provider and the infra role inside `iac/`** — the obvious form, and it is
   rejected for **two independent reasons that must not be collapsed into one**:
   - *Bootstrapping (mechanical, and would go away):* the config's first `apply` needs the credential that
     `apply` creates. The ways out are a local `apply` with human credentials — which is the very act 0014
     bounds, now recurring rather than one-time — or a second standing credential in CI, which trades a
     one-time wide credential for a permanent one and undoes 0015. **If a future second credential path
     removed this obstacle, option 2 would still be wrong**, because of:
   - *Self-escalation (a security property, permanent):* a role that can rewrite its own trust policy has
     no ceiling on it. It could add a subject to its own trust, or relax the policy that constrains it, and
     the change would arrive through the same automated path as a routine one. The blast radius of an
     `apply` must not include the authority to perform the next `apply`. This holds forever and is the
     load-bearing half of the decision.

   The same argument already shapes the policy document: `IamRoles` is scoped to the exact ARN
   `role/github-actions-tadeumendonca-io-fed` rather than a `github-actions-tadeumendonca-*` wildcard, and
   `IamPolicies` to `policy/tadeumendonca-fed-deploy-*` rather than `tadeumendonca-*`, precisely so the
   wildcard cannot reach the infra role or its own policy.
3. **A separate `bootstrap/` Terraform config with its own state, applied locally once** — *Why not:* it
   makes the exception *look* managed while leaving it exactly as manual — a human with wide credentials
   still performs the first run — and buys a second state file, a second workspace and a second thing that
   can drift. It converts an honest hole into a decorated one.
4. **A long-lived access key for a bootstrap identity, held as a repo secret** — *Why not:* it reintroduces
   precisely the standing liability ADR-0015 exists to remove, and it would be the *most* privileged key in
   the account.

## Decision outcome
Chosen: **the trust root is created out of band and stays out of Terraform.** Not "until we get to it" —
option 2's second reason does not expire, so this is the end state.

Two points of precision, because the imprecise version of each has been in circulation:

- **The exception is to 0014's principle, not to its mechanism.** No `terraform apply` has ever run outside
  CI, and none is required by this decision: the trust root is created with the AWS CLI/console, not with
  Terraform. What is qualified is 0014's *Consequences → Good* claim, "no irreversible cloud mutation in
  the inner loop" — the trust root **is** irreversible-class cloud mutation performed by a human on a
  laptop. Saying "the exception is a local `terraform apply`" is both wrong and more reassuring than the
  truth, since a `terraform apply` at least leaves a plan and a state entry; the CLI leaves neither.
- **The hand path is not only at t = 0.** `docs/iac-deploy-policy.md` is a standing runbook: every change to
  `tadeumendonca-iac-deploy` is applied by hand with `aws iam create-policy-version --set-as-default` (and,
  at 5/5 versions, a `delete-policy-version` first). That document has already been revised once after its
  creation, so this is an observed recurrence, not a hypothetical one. "Take the credentials away and never
  touch it again" describes the intent, not the lifecycle.

## Consequences
**Good**
- The role that runs Terraform cannot be modified by Terraform. Self-escalation through the delivery path
  is structurally unavailable, not merely unlikely.
- The wide-credential moment is bounded, explicit and rare, instead of being a standing CI capability.
- Everything downstream of the trust root — including the role that publishes the site — stays fully
  managed, planned and reviewed.
- What is unmanaged is written down in a desired-state document with an apply runbook, so it is auditable
  by comparison even though `plan` says nothing about it.

**Bad / accepted costs**
- **This is a documented hole in a floor.** There is a moment when a human applies infrastructure from a
  laptop with credentials wide enough to create an OIDC identity provider and an IAM role. The mitigation
  is that it happens once, at t = 0, and the credentials are removed afterwards — but **nothing mechanical
  enforces that removal**, nothing in CI can observe whether those credentials still exist, and the person
  who would notice is the person who created them. A stated limitation beats an unstated one; it does not
  stop being a limitation.
- The hand path reopens whenever `tadeumendonca-iac-deploy` changes (above), so the wide-credential surface
  is periodic rather than one-shot.
- **Terraform detects no drift on the trust root.** If the provider's thumbprint or the infra role's trust
  policy is edited in the console, no `plan` objects. AWS is the source of truth for what is attached; the
  JSON in `docs/` is the source of truth for what should be, and reconciling them is a human act.
- The write path of the infra policy is exercised only by a real `terraform-apply` that mutates a fed IAM
  resource, so a green `terraform-plan` proves the read scoping only — the proof asymmetry recorded in
  `docs/iac-deploy-policy.md`.
- A fork cannot skip this. Before its first CI run it must create the provider, the infra role and the
  policy by hand — on top of the hosted zone and the `us-east-1` ACM certificate that `data.tf` reads as
  pre-existing. The failure mode if it does not is opaque: `Not authorized to perform
  sts:AssumeRoleWithWebIdentity`, which reads identically to ADR-0015's immutable-subject trap.

## Links
- Amends [ADR-0014](./0014-terraform-cloud-pipeline-only.md) (its "no irreversible cloud mutation in the
  inner loop" claim is qualified by the bootstrap; see 0014's 2026-08-03 amendment) ·
  [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md) (the trust this bootstrap makes possible) ·
  runbook and desired-state document: `docs/iac-deploy-policy.md` + `docs/iac-deploy-policy.json` ·
  code: `iac/iam.tf` (what *is* managed), `iac/data.tf` (the other pre-existing prerequisites).
