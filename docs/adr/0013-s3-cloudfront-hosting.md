# 0013. S3 + CloudFront hosting with a URL-rewrite function

- **Status:** accepted · **amended 2026-11-01** (absorbs the rest of the `hosting-and-trust` capability,
  formerly records 0014, 0015, 0042, 0016 and 0017, as the sections *Pipeline-only apply*, *Pipeline
  credentials by OIDC*, *The trust root outside Terraform*, *Custom-domain email* and *The minimal
  infrastructure security posture*; every decision is unchanged, #456)
- **Capability:** `hosting-and-trust`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design), [ADR-0002](./0002-fully-static-spa-no-backend.md);
  the pipeline-only apply also by [ADR-0003](./0003-trunk-based-single-environment.md)

**This document is the whole `hosting-and-trust` capability.** The first half is the hosting decision
itself. The five sections after it are the decisions that keep that hosting trustworthy: who may change
it, with what credential, what sits outside the pipeline on purpose, the inbox at the apex, and why the
security posture is as small as it is. Each section was a record of its own until #456 folded it here;
each says where it came from.

## Context & problem
A fully static site (ADR-0002) is a set of objects that need hosting with HTTPS, a global CDN, and
**clean URLs** — the prerendered routes live at `dist/<locale>/<route>/index.html`, but visitors and
crawlers request `/en/me`, `/pt/portfolio`, `/en/blog/<slug>` without the `/index.html` suffix. Something
must map the directory route to its prerendered file. *(Written before ADR-0036 as `/cv`, `/portfolio`,
`/blog/:slug`; the mapping problem is unchanged, only the URL shape — and `iac/` needed no change for it,
which is ADR-0036's own point. #234.)*

## Decision drivers
- ADR-0053 (lean by design): near-zero cost, own the AWS/Terraform engineering (the argument is the code).
- HTTPS + global edge caching for a content site meant to be shared.
- Clean URLs for the prerendered routes.

## Considered options
1. **S3 origin + CloudFront + a CloudFront Function** (chosen) — objects in S3; CloudFront
   (`PriceClass_100`, NA+EU edges, the cheapest tier) serves them over HTTPS; a viewer-request
   **CloudFront Function** (`spa_rewrite`) rewrites directory routes to their prerendered
   `index.html`. *Trade-off:* more to provision (distribution, function, cache headers, invalidation)
   than a managed host.
2. **S3 static website hosting alone** — *Why not:* no HTTPS, no CDN, no edge rewrite; not viable for a
   shared, SEO-facing site.
3. **A managed platform (Vercel/Netlify)** — simpler DX. *Why not:* a third-party runtime dependency and
   less control, and it forfeits the AWS/Terraform engineering that is part of the proof (ADR-0053, lean by design).

## Decision outcome
Chosen: **S3 + CloudFront (`PriceClass_100`) + a viewer-request CloudFront Function** for clean URLs. A
CloudFront Function (not Lambda@Edge) does the rewrite — it is cheaper, runs at every edge, and is
sufficient for a pure string rewrite; the retired Lambda@Edge OG renderer (History) was the heavier tool
this replaces.

## Consequences
**Good**
- Cheap global CDN with HTTPS; scale-to-zero storage + edge cache.
- Clean URLs for every prerendered route via a tiny edge function.
- Full ownership in Terraform — the infra itself is part of the engineering argument.

**Bad / accepted costs**
- More to provision and operate than a managed host: the distribution, the function, split cache headers
  (immutable hashed assets vs no-cache `index.html`), and a **CloudFront invalidation on every deploy**.
- CloudFront config changes propagate slowly.

## Pipeline-only apply

**Absorbed 2026-11-01 (#456) from the record that held it, 0014, decided 2026-07-22 and amended
2026-08-03 and 2026-09-14.** The decision is unchanged and still binds. What arrived: the decision as it
binds, the rejected options still live, both amendments' narrowings, and the Dependabot exception in full,
because three workflow files point here for it. What was left in git history: nothing of substance; the
prose is tightened where it repeated itself. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0014-*'` names the commit that removed it, and its parent holds the
file.

### Context

The hosting above is code. That code needs somewhere to keep state and locks, and a rule for **who is
allowed to run `apply`**. On a public repository developed by agents, an agent (or a laptop) running
`terraform apply` against live AWS is exactly the irreversible, off-git boundary the whole delivery model
guards. ADR-0003 makes the merge the go/no-go, and infrastructure changes should ride the same gate; the
other drivers are no local drift, state locking and an audit trail.

### The decision, as it binds

**Terraform state lives in Terraform Cloud, with Local execution, and `apply`/`destroy` run in CI only.**
TFC holds state and locks; execution mode is **Local**, so GitHub Actions runs `plan` and `apply`. A
reviewed `plan` goes on the PR and `apply` runs on merge. `fmt`, `validate` and an inspection `plan` are
fine locally; `apply` and `destroy` are not. Cloud mutation is an outer-loop, human-gated act.

**It is total for Terraform and narrower for the account** (the 2026-08-03 narrowing). No
`terraform apply` has ever run outside CI. But the GitHub OIDC provider, the infra role CI assumes to run
Terraform, and that role's managed policy are created by hand with the AWS CLI. So there is
human-performed, irreversible-class cloud mutation at t = 0, and again whenever that policy is revised.
Why, and the scope of that exception, is *The trust root outside Terraform* below. A reader who takes
"pipeline-only" as total has read a narrower statement than it looks.

### Rejected options that are still live

No in-repo test refuses either of these, so the reasoning stays.

- **Local state and local `apply`.** No locking, no audit, drift between machines, and it puts
  irreversible cloud mutation in the inner loop. *(The workstation's deny floor refuses the
  `terraform apply` and `terraform destroy` prefixes, but that floor lives outside this repository.)*
- **TFC remote execution.** TFC's own runners would need standing cloud credentials. Local execution plus
  GitHub OIDC (*Pipeline credentials by OIDC* below) is fewer moving parts and no stored keys.

### Consequences still being paid

- A merge touching `iac/` applies real infrastructure — the plan on the PR must be read, not
  rubber-stamped. **On a Dependabot PR there is no plan at all**; see the next subsection.
- A dependency on Terraform Cloud. The workspace name is load-bearing: renaming it points Terraform at
  empty state. Kept deliberately as is.

### The plan does not run on a Dependabot PR — the second exception

Amended 2026-09-14 (#639). The decision is unchanged: `apply`/`destroy` still run in CI only. This
narrows the consequence above that reads as a safeguard, *"the plan on the PR must be read"*.

**On a Dependabot-triggered PR there is no plan to read.** GitHub gives such a run its own secret store,
and this repository has not populated it, so `AWS_INFRA_OIDC_ROLE_ARN` (an environment secret under
`staging`), `TFC_API_TOKEN` and `BUDGET_ALERT_EMAIL` are all empty and `configure-aws-credentials` fails
client-side with *"Could not load credentials from any providers"* **before any
`AssumeRoleWithWebIdentity` call is ever made** — so this was never an OIDC-trust or IAM defect. The
runner declares the store itself, in one line of its own log, and that is the falsifier to use rather
than inferring it from two secrets being empty together:

```
gh run view --repo tedeuxx/tadeumendonca-io --job 104129798792 --log | grep -m1 'Secret source'
# -> Secret source: Dependabot        (#587's terraform-plan)

# the CALIBRATION, as a whole second command rather than as an instruction to mutate the first —
# a selector that could only ever print "Dependabot" would prove nothing:
gh run view --repo tedeuxx/tadeumendonca-io --job 104116717340 --log | grep -m1 'Secret source'
# -> Secret source: Actions           (a push run's `gate` job, same repo, same selector)
```

**A caveat on job ids, learned by breaking it:** `gh run view --job <id> --log` serves the run's
**latest attempt**, not the attempt that produced the id. Re-running #587 on 2026-09-14 silently
re-pointed job `103012869416`'s log at attempt 2. The *answer* did not move — both attempts read
`Dependabot` — but a job id is not a stable citation for a log line, and the two ids above are used
because nothing will re-run them.

**`.github/workflows/iac.yml` skips the five credential-dependent steps when
`github.actor == 'dependabot[bot]'`** — the owner's ruling of 2026-09-11. The alternative, adding the
secrets to the Dependabot store, was **refused on the record**: it widens where an OIDC role ARN is
readable, which is a security decision rather than a mechanical fix. `pull_request_target` is the same
security class and is refused with it.

**Why the condition is on the STEPS and not on the job.** `terraform-plan` is the required check, and
**a skipped required check satisfies branch protection** — `iac.yml`'s own job header has said so since
#79. A job-level actor test would conclude the check `SKIPPED`, satisfy protection, and unblock the merge
with nothing having reported: the defect, delivered by the fix. It is not on the `changes` path filter
either — that filter answers *what changed* and the actor is *who* — and flipping its output would
corrupt the report step and diverge from `deploy.yml`'s parallel filter.

**The blast radius, bounded — and it is not the obvious one.** The intuitive cost — *an unreviewed
Terraform diff could merge* — describes an **empty class**. Dependabot cannot open a PR touching `iac/`
under the current configuration: `.github/dependabot.yml` declares npm on `/apps/fed` and
github-actions on `/`, and `iac/` holds no `package*.json`, no workflow and no `action.y*ml` (only
`.checkov.yaml`, which no ecosystem scans). Over every Dependabot PR ever opened here:

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

**What is surrendered is not a verification — the plan has never run on this class.** The OIDC
credential chain has never once been exercised on a Dependabot PR in this repository's history. Every
confirmed attempt failed in the credential provider, client-side, before any `AssumeRoleWithWebIdentity`
call, so the chain was never reached, let alone proved. **What is surrendered is an accidental block.**
Before the change, the structural red stopped every Dependabot PR touching a filtered workflow —
including one that would genuinely have broken assume-role — for a reason having nothing to do with the
bump. After it, that class merges green. The effect on such a PR is the same; the kind is different, and
it matters because **a reader who believes a safeguard is being given up will look for a replacement
safeguard. There is nothing to replace.**

**The narrower loss that is real, and unchanged by the skip:** `configure-aws-credentials` has three call
sites — one in `iac.yml`'s `terraform-plan`, two in `deploy.yml` (`terraform-apply`'s infra role, and the
fed deploy role) — and the `deploy.yml` pair only executes on push to `main`, after the merge, by
construction. So `terraform-plan` remains the sole PR-time exercise of that action **on a human PR**, and
the grouped `actions` bump moves all three together.

**The history, published as a criterion rather than an enumeration.** An enumeration verifies its
members and never the set, which is how #101 was missed for seven weeks; the first draft listed three
PRs and it was four. The criterion:

> **A Dependabot PR whose `terraform-plan` failed in the credential provider — *"Could not load
> credentials from any providers"* — because the run read an empty Dependabot secret store.**

It takes two commands. The first enumerates the **candidate set**, the file half of the criterion:

```
gh pr list --repo tedeuxx/tadeumendonca-io --state all --limit 200 --author app/dependabot \
  --json number,files --jq '[.[]|select(.files|map(.path==".github/workflows/iac.yml"
       or .path==".github/workflows/deploy.yml")|any)|.number]'
# -> [587, 534, 414, 361, 101]
```

The second confirms the failure half per candidate, which is a property of a run and cannot be read off
the PR:

```
gh run view --repo tedeuxx/tadeumendonca-io --job <that PR's terraform-plan job> --log \
  | grep -m1 'Secret source'
```

The table is that command's answer on 2026-09-14, row by row:

| PR | opened | fate | `terraform-plan` | `Secret source` |
|---|---|---|---|---|
| **#101** | 2026-07-24 | closed unmerged **59 minutes later** | fail | `Dependabot` (job `89483349402`) |
| **#361** | 2026-08-06 | closed unmerged 2026-08-09 | **unknown** | **unknown** — see below |
| **#414** | 2026-08-09 | closed 2026-08-21, **re-authored by hand as `76f3910`** | fail | `Dependabot` (job `96551321721`) |
| **#534** | 2026-08-27 | closed 2026-09-03 when #587 superseded it | fail | `Dependabot` (job `98642556992`) |
| **#587** | 2026-09-03 | open, blocked 11 days | fail | `Dependabot` (job `103012869416`, **now serving attempt 2** — see the caveat above; attempt 2's own job is `104129798792` and reads the same) |

**#361 is unknown and is deliberately not rounded up.** `gh pr checks 361 --repo tedeuxx/tadeumendonca-io`
returns *"no checks reported on the 'dependabot/github_actions/actions-60040f6dca' branch"*, so it
matches the file criterion and its verdict cannot be recovered. **Four confirmed, one unknown.**

**#101 is casualty zero, and the misreading of it became a written justification.** `#101` is a
Dependabot PR (`gh pr view 101 --repo tedeuxx/tadeumendonca-io --json author --jq .author.login` →
`app/dependabot`), closed unmerged 59 minutes after it opened. Its failing step's inputs are
signature-identical to #587's — `role-to-assume` absent from the `with:` block,
`TF_TOKEN_app_terraform_io` empty, the same twelve `Could not load credentials` retries. It never
exercised the OIDC chain at all. It was read at the time as *"configure-aws-credentials v6 broke our
assume-role and infra-plan caught it RED on the PR"*, and that reading became the written justification
in `.github/dependabot.yml` for admitting action majors. A secret-store failure was recorded as a
successful supply-chain gate. **The lesson is not that the conclusion was wrong; it is that a
true-sounding explanation closed the inquiry**, and the mechanism underneath went unexamined through
four more PRs and seven weeks. The corrected justification in `dependabot.yml` no longer rests on #101.
`76f3910`'s commit body already contained the whole diagnosis, including that
`gh secret list --app dependabot` returns nothing — correctly diagnosed on 2026-08-21, paid for by hand,
and recorded nowhere anybody would meet it again. That is the failure this subsection exists to prevent.

**What a maintainer does when a real plan is wanted — measured, not read.** Push a commit to the
Dependabot branch. That fires `pull_request: synchronize` with a human actor and
`Secret source: Actions`, so every gated step runs. *Permanent cost:* Dependabot stops managing that PR.
**The re-run button is not the route.** Re-running run `34519358480` as a maintainer produced attempt 2
with `Secret source: Dependabot` (2026-09-14): `github.actor` stays the actor of the initial run, and a
re-run replays the original run's workflow file. **`workflow_dispatch` is not an option either:**
`iac.yml` is `on: pull_request` only, and a dispatch carries no `github.event.pull_request`.

**The residual — nothing enforces any of this.** A skipped job concludes `SKIPPED`; a skipped step
concludes `SUCCESS`. Neither means *"ran and verified nothing"*. So the signal lives in two artifacts a
human reads — a `::warning::` annotation from `Report what was verified`, and a PR comment under the
plan's own marker saying no plan was produced — and a human reading them is the whole of the control. No
CI arm observes a Dependabot PR merging without a plan, and none can: the merge is a human act on a green
required check. `actionlint` proves the `if:` expression parses; nothing proves it is right.

**One decision deliberately not taken.** May a Dependabot PR bumping an action on the OIDC path merge on
a skipped plan, or is it re-authored by hand as #414 was? The `#414 -> 76f3910` precedent says by hand,
and that commit's body records the cost: every SHA re-resolved from upstream tags, every `# vX.Y.Z` pin
comment re-verified, and the loss of Dependabot's automatic pin-comment rewrite. **Do not pay it by
default.** The question is the owner's.

### Where it came from

Decided 2026-07-22; the 2026-08-03 narrowing came with the trust-root record (#318); the 2026-09-14
exception is #639, with #587 as the PR that exposed it. Code: `.github/workflows/iac.yml`,
`.github/workflows/deploy.yml`, `.github/dependabot.yml`. Absorbed here by #456.

## Pipeline credentials by OIDC

**Absorbed 2026-11-01 (#456) from the record that held it, 0015, decided 2026-07-22.** The decision is
unchanged and still binds. Everything arrived; nothing of it was narrative. The full record is in git
history: `git log --diff-filter=D -- 'docs/adr/0015-*'`.

### Context

CI has to touch AWS — sync the site to S3, invalidate CloudFront, run `terraform apply`. That requires
credentials. Long-lived AWS access keys stored as repository secrets are a standing liability: they leak,
they rotate, and they grant more than any one job needs. The drivers: no long-lived secrets in the
repository (lean by design: minimal attack surface), least privilege per job, and a trust that survives a
repository rename.

### The decision, as it binds

**Each workflow job assumes a scoped role through GitHub OIDC, and every role's trust is pinned to the
immutable numeric-ID subject**, `repo:<org>@<org_id>/<repo>@<repo_id>:*` — the ID-embedded subject
GitHub now emits. Role ARNs are environment-scoped secrets; tooling tokens are repository secrets. No AWS
keys live in the repository. The provider this trust points at, and the infra role itself, are created
outside Terraform (*The trust root outside Terraform* below).

### Rejected options that are still live

No in-repo test refuses these, so the reasoning stays.

- **Long-lived AWS access keys as secrets.** Leakable, a rotation burden, over-scoped — precisely what
  OIDC removes.
- **Trust on the mutable `repo:<org>/<repo>:*` subject**, the obvious form. It broke **every**
  assume-role when the repository was renamed `tadeumendonca-pwa` → `tadeumendonca-io`, because the
  plain-name subject no longer matched. A real incident this decision exists to prevent recurring.

### Consequences still being paid

- No long-lived credentials; short-lived tokens per job; least privilege per role; and the trust survives
  a rename, because the numeric IDs do not change when the name does.
- The immutable subject is a **trap for the unwary**: a rename that does not update the trust, or a trust
  written with the plain name, silently breaks every deploy with `Not authorized to perform
  sts:AssumeRoleWithWebIdentity`.
- Role and trust changes are pipeline-only (*Pipeline-only apply* above), so fixing a broken trust is
  itself a gated change.
- The same reasoning keeps OIDC-credentialed jobs off path filters that would widen the credential
  surface; `app.yml`, `deploy.yml` and ADR-0043 apply it to a CI path filter.

## The trust root outside Terraform

**Absorbed 2026-11-01 (#456) from the record that held it, 0042, decided 2026-08-03.** The decision is
unchanged and still binds. What arrived: the decision, both reasons for it kept separate, the rejected
options, and every accepted cost. What was left in git history: the note that the README had named this
record as owed. `git log --diff-filter=D -- 'docs/adr/0042-*'` names the commit that removed it.

### Context

*Pipeline-only apply* puts `apply`/`destroy` in the pipeline and nowhere else. *Pipeline credentials by
OIDC* says the pipeline gets its credentials by assuming an OIDC role rather than by holding a key. Both
**presuppose something neither creates**: a GitHub OIDC identity provider in the account, and an *infra*
role (`AWS_INFRA_OIDC_ROLE_ARN`) that CI assumes in order to run Terraform at all.

What `iac/` actually manages, verified in the code rather than inferred:

- `iam.tf` creates the **fed deploy** role (`module.oidc_fed`) and its scoped policy
  (`module.policy_fed_deploy`), and publishes the role ARN to SSM. That is the role that *publishes the
  site*.
- There is **no** `aws_iam_openid_connect_provider` resource anywhere in the root module. The
  `iam-assumable-role-with-oidc` module composes the provider ARN as a string
  (`arn:<partition>:iam::<account>:oidc-provider/${provider_url}`), so the provider must already exist for
  the role's trust policy to reference anything real.
- There is **no** resource for the infra role or for its managed policy `tadeumendonca-iac-deploy`. That
  policy exists in this repository only as a desired-state document, `docs/iac-deploy-policy.{md,json}`,
  applied by hand via the AWS CLI.

So the account has a small **trust root** — provider, infra role, infra policy — that is deliberately
outside Terraform. Drivers: any exception to the pipeline-only floor must be bounded and written down; no
long-lived AWS credentials anywhere in the delivery path; the first `apply` of a config that creates the
CI credential would need that credential to run; the role that holds the most privilege needs a ceiling;
and what Terraform does not manage must be documented and auditable, since `plan` will not describe it.

### The decision, as it binds

**The OIDC provider, the infra role and `tadeumendonca-iac-deploy` are created by the owner with the AWS
CLI, once, before the first CI run, and stay out of Terraform permanently.** `iac/` manages everything
downstream of them, including the fed deploy role. Not "until we get to it": the second reason below does
not expire, so this is the end state.

Two points of precision, because the imprecise version of each has been in circulation:

- **The exception is to the pipeline-only principle, not to its mechanism.** No `terraform apply` has
  ever run outside CI, and none is required: the trust root is created with the AWS CLI or console. What
  is qualified is the claim "no irreversible cloud mutation in the inner loop" — the trust root **is**
  irreversible-class cloud mutation performed by a human on a laptop. Saying "the exception is a local
  `terraform apply`" is both wrong and more reassuring than the truth, since a `terraform apply` at least
  leaves a plan and a state entry; the CLI leaves neither.
- **The hand path is not only at t = 0.** `docs/iac-deploy-policy.md` is a standing runbook: every change
  to `tadeumendonca-iac-deploy` is applied by hand with `aws iam create-policy-version --set-as-default`
  (and, at 5/5 versions, a `delete-policy-version` first). That document has already been revised once
  after its creation, so this is an observed recurrence, not a hypothetical one.

The same argument shapes the policy document: `IamRoles` is scoped to the exact ARN
`role/github-actions-tadeumendonca-io-fed` rather than a `github-actions-tadeumendonca-*` wildcard, and
`IamPolicies` to `policy/tadeumendonca-fed-deploy-*` rather than `tadeumendonca-*`, precisely so the
wildcard cannot reach the infra role or its own policy.

### Rejected options that are still live

No in-repo test refuses any of these, so the reasoning stays.

- **Terraform manages the provider and the infra role inside `iac/`** — the obvious form, rejected for
  **two independent reasons that must not be collapsed into one**:
  - *Bootstrapping (mechanical, and would go away):* the config's first `apply` needs the credential that
    `apply` creates. The ways out are a local `apply` with human credentials — the very act the
    pipeline-only floor bounds, now recurring rather than one-time — or a second standing credential in
    CI, which trades a one-time wide credential for a permanent one and undoes the OIDC decision. **If a
    future second credential path removed this obstacle, this option would still be wrong**, because of:
  - *Self-escalation (a security property, permanent):* a role that can rewrite its own trust policy has
    no ceiling on it. It could add a subject to its own trust, or relax the policy that constrains it, and
    the change would arrive through the same automated path as a routine one. The blast radius of an
    `apply` must not include the authority to perform the next `apply`. This holds forever and is the
    load-bearing half of the decision.
- **A separate `bootstrap/` Terraform config with its own state, applied locally once.** It makes the
  exception *look* managed while leaving it exactly as manual — a human with wide credentials still
  performs the first run — and buys a second state file, a second workspace and a second thing that can
  drift. It converts an honest hole into a decorated one.
- **A long-lived access key for a bootstrap identity, held as a repository secret.** It reintroduces
  precisely the standing liability the OIDC decision removes, and it would be the *most* privileged key in
  the account.

### Consequences still being paid

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
  who would notice is the person who created them.
- The hand path reopens whenever `tadeumendonca-iac-deploy` changes, so the wide-credential surface is
  periodic rather than one-shot.
- **Terraform detects no drift on the trust root.** If the provider's thumbprint or the infra role's trust
  policy is edited in the console, no `plan` objects. AWS is the source of truth for what is attached; the
  JSON in `docs/` is the source of truth for what should be, and reconciling them is a human act.
- The write path of the infra policy is exercised only by a real `terraform-apply` that mutates a fed IAM
  resource, so a green `terraform-plan` proves the read scoping only — the proof asymmetry recorded in
  `docs/iac-deploy-policy.md`.
- A fork cannot skip this. Before its first CI run it must create the provider, the infra role and the
  policy by hand — on top of the hosted zone and the `us-east-1` ACM certificate that `data.tf` reads as
  pre-existing. The failure mode if it does not is opaque: `Not authorized to perform
  sts:AssumeRoleWithWebIdentity`, which reads identically to the immutable-subject trap above.

### Where it came from

Decided 2026-08-03, when the walkthrough moving off `/architecture` to the READMEs (#318) would otherwise
have taken the only written form of this reasoning with it. Runbook and desired-state document:
`docs/iac-deploy-policy.md` and `docs/iac-deploy-policy.json`. Code: `iac/iam.tf` (what *is* managed),
`iac/data.tf` (the other pre-existing prerequisites). Absorbed here by #456.

## Custom-domain email

**Absorbed 2026-11-01 (#456) from the record that held it, 0016, decided 2026-07-22.** The decision is
unchanged and still binds; everything arrived. `git log --diff-filter=D -- 'docs/adr/0016-*'` names the
commit that removed it.

### Context

The domain needs a professional inbox at the apex for contact. Running or renting mail
infrastructure would be cost and operational surface — the opposite of lean by design — for a single
personal mailbox. The email must also be **independent of the site**: the inbox should work whether or
not the site is deployed.

### The decision, as it binds

**Apple iCloud+ Custom Email Domain.** Apple hosts the mailbox; the domain is enrolled by adding
Apple-provided **MX/TXT/CNAME** records to Route53, using the iCloud+ subscription the owner already has.
Only the DNS records live in this repository's Terraform (`iac/email.tf`); the mailboxes are Apple's.
Email is fully decoupled from the site's deploy and from the CloudFront distribution.

### Rejected options that are still live

- **AWS SES / WorkMail.** SES is for sending, not a personal inbox; WorkMail is per-mailbox cost and setup
  for something iCloud+ already covers.
- **Google Workspace.** A new recurring subscription for one mailbox.

### Consequences still being paid

- Zero mail infrastructure and no new subscription; the inbox survives any site change.
- Tied to Apple's ecosystem and its enrollment flow; the records are provided by Apple, not derived.
- Sending automated mail, were it ever needed, is out of scope — this is a human inbox, not a
  transactional mail path (that was SES, retired with the backend — History).

## The minimal infrastructure security posture

**Absorbed 2026-11-01 (#456) from the record that held it, 0017, decided 2026-07-22.** The decision is
unchanged and still binds; everything arrived. It supersedes the shared regional WAF (History index).
`git log --diff-filter=D -- 'docs/adr/0017-*'` names the commit that removed it.

### Context

At the infrastructure level a security and encryption posture has to be chosen: a WAF in front of the
CDN, customer-managed KMS keys (CMK), encrypted (`SecureString`) SSM parameters. Each is a real control
with real cost — and for a static site with **no dynamic endpoint, no auth, no user data** (ADR-0002),
most of them defend a surface that does not exist. Drivers: the minimal attack surface ADR-0002 produced;
lean by design (do not pay for controls with no threat or compliance driver); and keeping the config bus
non-sensitive by construction, so encryption is not needed for it.

### The decision, as it binds

**No WAF, AWS-managed keys (no CMK), SSM `String` only.** No WAF, because nothing dynamic sits behind
CloudFront to protect. Default AWS-managed encryption, because a static site has no compliance driver for
customer-managed keys. SSM parameters are **`String` only**, holding non-sensitive names, ids and ARNs
(the config bus) — never secrets. Runtime secrets, if any ever existed, would go to Secrets Manager; there
are none. Security at the infrastructure level is deliberately minimal *because the architecture made the
surface minimal*. This is the infrastructure half of the security posture; the application half (Sonar
SAST and package-vulnerability scanning) is [ADR-0021](./0021-application-security-posture.md).

**The `String`-only rule has a mechanism beside it.** `iac/.checkov.yaml` skips `CKV2_AWS_34` ("SSM
Parameter should be Encrypted") with the policy written as its comment; that skip is what keeps the
policy scan green on this choice. It does not refuse a `SecureString` — nothing does.

### Rejected options that are still live

- **Keep the shared regional WAF.** Recurring cost to protect a static bucket behind CloudFront with no
  dynamic endpoints; it defended the retired API/auth tier, not this.
- **CMK everywhere and `SecureString` SSM.** Key-management cost and ceremony with no compliance or threat
  driver; there are no secrets in the config bus to encrypt.

### Consequences still being paid

- Near-zero security-infrastructure cost, matched to an actually minimal attack surface; no WAF rules, no
  key rotation, no encrypted-parameter handling to misconfigure.
- The posture is **calibrated, not permanent**: adding a dynamic or authenticated surface re-introduces
  WAF, CMK and Secrets Manager (the gradual-evolution path in ADR-0053, lean by design).
- It relies on the discipline that SSM holds only non-sensitive config — a secret placed there by mistake
  would be unencrypted (mitigated: nothing sensitive belongs on the bus by policy).

## Links
- Driven by ADR-0053 (lean by design), ADR-0002, ADR-0003 · the deploy publishes to S3 + invalidates
  CloudFront (see the SDLC ADRs) · the CloudFront Function replaces the retired Lambda@Edge OG renderer
  (History index).
- Absorbed by #456 (2026-11-01): the pipeline-only apply (formerly record 0014), the OIDC credentials
  (0015), the trust root (0042), the custom-domain email (0016) and the minimal security posture (0017).
  Each section above says where it came from and how to recover the original from git history.
- The application security posture is [ADR-0021](./0021-application-security-posture.md) · the cost of
  this infrastructure is argued on `/architecture` · runbook: `docs/iac-deploy-policy.md`.
