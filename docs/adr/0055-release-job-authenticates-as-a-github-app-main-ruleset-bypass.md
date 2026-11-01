# 0055. The release job authenticates as a GitHub App, and `main` is governed by a ruleset with that App as its only bypass actor

- **Status:** accepted (the owner's decision, *«Ruleset + App»*, recorded on Issue
  [#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783) on 2026-10-31)
- **Date:** 2026-11-01
- **Deciders:** the owner · written by `tech-lead` in the implementing merge request
- **Supersedes / superseded by:** — (*Decision outcome* says why none of the records that describe branch protection is superseded)
- **Driven by:** Issue [#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783);
  [ADR-0022](./0022-numeric-semver-auto-release.md) (the release this credential serves) and
  [ADR-0044](./0044-version-parts-deliberate-major-minor.md) (the same job, dispatched by hand)

## Context & problem

The `release` job in `deploy.yml` bumps `VERSION`, pushes the `bump:` commit and its tag straight to
`main`, and creates the GitHub Release the site's footer links to. Under
[ADR-0003](./0003-trunk-based-single-environment.md)'s amendments the deploy runs behind it, so a
`release` that cannot push stops the site from shipping, not only from tagging.

It pushed with a fine-grained personal access token, `VERSION_BUMP_TOKEN`. That token expired, and the
job failed at checkout (`could not read Username`) from 2026-10-24 to 2026-10-30: deploy runs
40107669946, 40111086740, 40130367868 and 40131223563, as listed on the Issue. The token was renewed
for 90 days. **GitHub has no way for a personal access token to rotate itself**, so the same outage is
scheduled for around 2027-01-28 and every 90 days after.

**Why the token could push at all is the fact that shaped the decision.** The owner read the protection
on 2026-10-31 (`gh api repos/tedeuxx/tadeumendonca-io/branches/main/protection`, recorded on the Issue):
classic branch protection; a pull request required (zero approvals); required checks `build-test`,
`actionlint`, `terraform-plan`, not strict; **`enforce_admins: false`**. The token pushed because it
acted as an administrator, and administrators skipped the rules. So the question was never only *which
credential*; it was *which actor may push to `main` without a pull request, and how is that stated*.

**This library's proposed entry rule ([ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md))
was applied before writing a file.** *Capability limb:* the capability table is not published yet, so
no capability document exists to take this as a section; when one for the delivery pipeline exists,
this record is a candidate to fold into it. *Re-decision limb, per rejected option:*
`apps/fed/scripts/deploy-workflow.test.mjs` refuses the old secret's **name** and asserts the job token
is `contents: read`, which refuses a `GITHUB_TOKEN` write. It does not refuse a renewed PAT stored under
another name, and nothing in the repository can refuse anything about the ruleset, which lives in
repository settings. So the record is owed.

## Decision drivers

- **No credential in the release path may expire on a calendar.** That is the outage being fixed.
- **The actor that may push to `main` without a pull request must be named and narrow.** Today it is
  "any administrator", which is broader than the one job that needs it.
- **Least privilege for the job's own token** ([ADR-0021](./0021-application-security-posture.md)'s
  supply-chain lever; [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md)'s posture for
  pipeline identity).
- **The three required checks and the pull-request requirement stay exactly as they are.** The
  migration must not open a window where `main` is ungated.

## Considered options

1. **Renew the personal access token (the status quo).** Nothing to build, and the loop guard, the
   protection and every workflow stay as they are. *Trade-off:* the job breaks again every 90 days,
   or whenever the token's lifetime is set, and is fixed only by the owner noticing a red deploy and
   renewing by hand. A non-expiring token is not an escape: it is a long-lived credential that keeps
   the administrator bypass, which is the option-3 cost without the narrowing. **Rejected:** it is the
   outage on a timer.
2. **`GITHUB_TOKEN`.** No stored secret at all; the token is minted per run and dies with the job; and
   because GitHub does not start workflows from a `GITHUB_TOKEN` push, the `bump:` loop guard would
   have nothing to do. *Trade-off, and it is fatal:* under the measured protection a pull request is
   required, and `GITHUB_TOKEN` is not an administrator and cannot be put on a bypass list, so its push
   of the `bump:` commit is refused. **Ruled out by the owner's measurement**, not by preference.
3. **A GitHub App for the release job, and a repository ruleset on `main` with that App as its only
   bypass actor (chosen).** The ruleset keeps the pull-request requirement (zero approvals), the three
   required checks with *require branches to be up to date* off, and blocks force-push and deletion.
   The App has Contents read and write and Metadata read only, is installed on this repository only,
   and has its webhook off. The job mints a token from the App's ID and key with
   `actions/create-github-app-token`, narrowed to `permission-contents: write`; the token lives one
   hour at most and the action revokes it at the end of the job. *Trade-off:* a private key that never
   expires, a new third-party action, and administrators losing their skip (see *Consequences*).
   Classic protection cannot express this: an App cannot be an administrator, and classic protection
   has no per-actor bypass for a push, which is why the protection object changes along with the
   credential.

## Decision outcome

**Option 3.** `release` writes to `main` as the GitHub App and as nothing else: the checkout that
pushes the commit and tag, `gh release list` and `gh release create` all use the minted token, and the
job's own `GITHUB_TOKEN` is `contents: read`. `main` is governed by a repository ruleset whose bypass
list holds **the App and no other actor**, and classic branch protection is removed.

**The order is part of the decision.** The ruleset is active and the classic protection removed
before this merge, and nothing else merges in between: once the ruleset is active, the old token can
no longer push the `bump:` commit, so any other merge in that window breaks `release`. If the classic
protection were removed before the ruleset existed, `main` would be ungated in between.

**The `bump:` loop guard stays.** A push made with an App token does start workflows, as the personal
access token's did, so the `bump:` commit re-enters `deploy` and the job's `if:` is still what stops
it.

**Which records this one touches, and why none is superseded.** Four records describe "branch
protection" as the mechanism of their time:
- [ADR-0003](./0003-trunk-based-single-environment.md) — its considered option on folding the bump into
  `deploy` names *"the bump PAT"*, with `workflows: write`. That rejected option is argued from what a
  compromised dependency could hold, and it still holds: the App token is a repository write credential
  too.
- [ADR-0014](./0014-terraform-cloud-pipeline-only.md) and
  [ADR-0021](./0021-application-security-posture.md) — *"a skipped required check satisfies branch
  protection"*, and why that forces `if: always()` on a required aggregator.
- [ADR-0018](./0018-ci-gates-e2e-on-pr-coverage.md) — a workflow with a top-level `paths:` filter
  *"cannot be a required status check"*.

What those records decide is about **required status checks**, and a ruleset carries required status
checks with the same semantics as classic protection. GitHub's documentation treats a skipped required
check as passing and a never-reported one as pending in both. **That is read from GitHub's
documentation, not measured on this repository's ruleset.** On that reading every decision in the four
records still binds; only the noun naming where the requirement lives has changed. So this record
supersedes and amends none of them. Their "branch protection" wording is left as a record of its time,
and a reader maps it to *the ruleset on `main`*. One of them also carries a discharged gap:
ADR-0021's *"Not verified by me: the contents of branch protection on `main`"* is answered by the
owner's 2026-10-31 read above. That record is not edited for it.

## Consequences

**Good**
- **The release path no longer expires on a calendar.** The credential that runs it is a token minted
  per run, valid one hour at most.
- **The push bypass is narrowed from "every administrator" to one App** whose only repository
  permission is Contents. Before, the bypass followed a person's role; now it follows one named actor.
- **A direct push to `main` from the owner's credential is refused by the forge.** The brief's floor
  rule against pushing to the trunk was held by instruction alone, because agents act through an
  administrator credential and administrators skipped the rules. Under the ruleset that credential is
  no longer exempt, so the rule gains a layer that holds it. This follows from the configuration in
  *Decision outcome*; it is verified only when the ruleset is read live after the merge, as the Issue's
  acceptance criteria require.
- **Less is exposed in the `release` job.** Before, the token persisted by `actions/checkout` in that
  job was a 90-day credential that skipped every rule. Now it is a one-hour, Contents-only token. The
  job still runs `pip install bump-my-version` unpinned after that checkout. That residual is named
  here and not fixed; it was there before this change.

**Bad / accepted costs**
- **The App's private key is a standing credential with no expiry.** Whoever holds it can mint a token
  that pushes to `main` with no pull request and no checks, and the next merge deploys that tree. Its
  blast radius equals the old token's, without the expiry that at least bounded a leak. The key lives
  only as the `RELEASE_APP_PRIVATE_KEY` repository secret, and only the `release` job reads it.
  Rotation is by hand: generate a new key in the App's settings, store it, delete the old key. Nothing
  reminds anyone to do it, and nothing detects a leaked key.
- **A new third-party action enters the pipeline.** It is `actions/create-github-app-token`, pinned to
  `64ab729a6294000f5aa4a4bc0b73d1f32bc45510` (v3.3.0; `git ls-remote` on the action's repository
  resolves the tag to that commit). It handles the private key directly, so a compromise of the action
  at a future pin is a compromise of the bypass. The pin is the control, and moving it is a reviewed
  change like any other dependency bump.
- **The action's `app-id` input is deprecated.** v3.3.0's `action.yml` marks it with
  *"Use 'client-id' instead."* The stored secret is the numeric App ID, so the workflow uses `app-id`.
  Moving to `client-id` needs a new secret holding the App's client ID, which is the owner's act. Until
  then every run logs a deprecation warning, and a future major version may drop the input.
- **Administrators no longer skip the rules.** Any merge or push made with the owner's credential,
  the gate's `gh pr merge` included, now needs the three checks green. This is stricter than before and
  intended: the loop already requires green checks before a merge. The cost lands in an emergency,
  where a fix that cannot pass its checks can no longer be forced through by an administrator. The way
  out then is a ruleset change, which is the owner's act and is visible in the repository's settings.
- **The protection of `main` is not in the repository.** It was not before either. Nothing in this
  tree can check that the ruleset exists, holds these rules or lists only the App. That is a live read
  (`gh api repos/tedeuxx/tadeumendonca-io/rules/branches/main`), outside every gate. A required job
  renamed in a workflow still un-gates `main` silently, exactly as under classic protection.
- **The `bump:` loop guard stays load-bearing.** Option 2 would have made it vestigial. Option 3 keeps
  an App-token push starting workflows, so the guard and the message format it matches must stay
  aligned.

## Links

- Issue [#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783): the outage, the owner's
  protection read, his decisions and the ordered settings acts.
- [ADR-0022](./0022-numeric-semver-auto-release.md) — the automatic release this credential serves.
- [ADR-0044](./0044-version-parts-deliberate-major-minor.md) — the same job by hand, which mints the
  same token.
- [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md) — the cloud-side pipeline identity; it is
  untouched, and the App is the forge-side counterpart.
- [ADR-0003](./0003-trunk-based-single-environment.md), [ADR-0014](./0014-terraform-cloud-pipeline-only.md),
  [ADR-0018](./0018-ci-gates-e2e-on-pr-coverage.md), [ADR-0021](./0021-application-security-posture.md):
  they still bind, read with *ruleset* for *branch protection* (see *Decision outcome*).
- `.github/workflows/README.md`, *Rules the design has to obey*: the operative description of the
  ruleset.
- The twin for the method's own repository: tedeuxx/mhw#251.
