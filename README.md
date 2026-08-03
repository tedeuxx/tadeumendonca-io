# tadeumendonca-io

The public presence for [tadeumendonca.io](https://tadeumendonca.io) — a **fully static SPA** that serves as
the owner's proof-of-engineering: an interactive CV, a portfolio that links to a curated catalog of automations
and agentic tools, and a blog. It backs a repositioning to **AI Engineer** (agentic development / AI-native
automations), anchored in SDLC and distributed systems.

**Every public URL carries a locale prefix** — `/pt/…` and `/en/…` — and the path is authoritative, so a
shared link keeps its language regardless of the reader's browser (ADR-0036). The bare root `/` is the one
deliberate exception: it is prerendered in English as the `x-default` entry for a JS-less crawler.

Five surfaces:

1. **Landing** (`/`) — the storefront; it also hosts the articles list (`#artigos`).
2. **Interactive CV** (`/me`) — canonical reference of the owner's experience, and the only CV surface.
   `/cv.pdf` is the two-page recruiter edition printed from it at build time, in the site's own dark palette.
3. **Portfolio** (`/portfolio`) — a curated catalog of public repos (automations, agents, MCP servers, AI-native tools) that back the positioning with real code.
4. **Ramp-up** (`/ramp-up`) — the open plan for the AI-Engineer transition.
5. **Architecture** (`/architecture`) — how the site is built, linking the ADRs and both public repos.

Long-form writing lives at `/blog/:slug`, with a **per-locale slug** (ADR-0037). There is no `/blog` list
page — it was retired, and `/blog` redirects to the landing's `#artigos`.

## Stack

- **Frontend** (`apps/fed`): React 18 + Vite + TypeScript, Tailwind v3 (no shadcn), **no PWA**. Content ships
  in the repo in two shapes — **markdown** for long-form (articles, ramp-up, architecture) and **typed
  TypeScript** for structured data (`src/data/profile.ts` is the CV). The build **prerenders each route in
  both locales** (Playwright) so OG/SEO tags land in the served HTML, and prints `/cv.pdf` in the same pass.
  **Everything a reader reads is authored in pt-BR and en** — chrome, CV and prose alike — and a missing
  translation is a compile error, not a runtime surprise (ADR-0032, ADR-0036).
- **Infra** (`iac`): Terraform for the frontend infra **plus one account-wide guardrail** — S3 + CloudFront
  (with a viewer-request URL-rewrite function), custom email via iCloud, the GitHub OIDC deploy roles, and
  an **account-level cost budget** (`budget.tf`) deliberately *not* scoped to this project's tags, so it
  catches spend this repo did not create. State in Terraform Cloud, **local** execution; `apply`/`destroy`
  are **pipeline-only**.

There is **no backend** — no API, database, auth, or Lambda. Cost is near-zero / scale-to-zero (static objects
on CloudFront); the CI OIDC roles are least-privilege and pinned to the repo's immutable OIDC subject.

## What you need before you fork

**Three of the six cost money** — and a reader four steps into a setup should not be the one to discover
it. What they buy: a site live at your own apex, prerendered in two locales, gated before every merge,
and deployed by merging.

### Accounts

| | free at this size? | why you need it |
|---|---|---|
| **AWS account** | **no** — see the cost below | S3, CloudFront, Route 53, ACM |
| **A registered domain** | **no** — the largest single line in this site's bill | the site serves at an apex you own |
| **GitHub account** | yes — **because this repo is public**; Actions minutes are metered on a private one | the repo, and CI is GitHub Actions |
| **Terraform Cloud org** | yes — this workspace is small enough for the free tier | Terraform state. Execution mode is **Local**, so TFC holds state and CI runs the plan |
| **SonarCloud account** | yes — **because this repo is public** | the quality gate on `app` |
| **Claude Code** | **no** — a paid Anthropic plan | only if you want the *loop*. See [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) |

**Each cell states its own condition, and none of these vendors is something this file can keep true.**
They set their own tiers and change them without telling a README, so check the pricing yourself —
[GitHub](https://github.com/pricing), [AWS](https://aws.amazon.com/pricing/),
[HashiCorp](https://www.hashicorp.com/pricing), [SonarCloud](https://www.sonarsource.com/plans-and-pricing/),
[Anthropic](https://www.anthropic.com/pricing) — rather than trusting the table above.

**The site runs without Claude Code**, and the plugin repo is the half you can adopt with **no cloud
account and no AWS bill at all** — it has neither.

### Local toolchain

- **Node ≥ 22** (`engines` in [`package.json`](./package.json)) and npm.
- **Terraform CLI** — for `fmt`/`validate` and an inspection `plan`. You never run `apply` locally: it is
  pipeline-only.
- **Playwright's Chromium** — installed as its own step (`npx playwright install --with-deps chromium`),
  not pulled in by `npm ci`. It is a **build** dependency rather than a test one: the build prerenders
  every route in a real browser and prints `/cv.pdf` from `/en/me` in the same pass.

### What it costs to run

**Single-digit dollars a month, and almost all of it is the name.** Registration amortized plus the
Route 53 hosted zone dwarf everything else: publishing is cents, and serving a visitor rounds to zero.
**Your TLD sets that line, not this architecture** — a `.com` and a `.io` are different bills for the
same site. The figure, its measurement date, and
why it is sourced partly from the bill and partly from the registrar's price list are on
[`/architecture`](https://tadeumendonca.io/en/architecture) — or, if you have the clone,
[`architecture.en.md`](./apps/fed/src/content/architecture.en.md) — **stated there and not repeated here**, so
one number does not go stale on two surfaces. That page also treats it as a measurement with a date
rather than a standing fact, which is the framing the number needs and this table cannot carry.

### GitHub secrets and variables

Read out of the workflows rather than from memory — `grep -o 'secrets\.[A-Z_]*' .github/workflows/*.yml`
prints twelve lines for **seven distinct secrets**, and exactly three jobs declare `environment: staging`
(`iac` → `terraform-plan`, `deploy` → `terraform-apply`, `deploy` → `deploy-app`).

| secret | scope | consumed by | what it gates |
|---|---|---|---|
| `AWS_FED_OIDC_ROLE_ARN` | **environment** (`staging`) | `deploy` → `deploy-app` | the role that publishes the site; without it nothing reaches S3 or CloudFront |
| `AWS_INFRA_OIDC_ROLE_ARN` | **environment** (`staging`) | `iac` → `terraform-plan`, `deploy` → `terraform-apply` | the role that runs Terraform — no plan on PRs, no apply on merge |
| `BUDGET_ALERT_EMAIL` | **environment** (`staging`) | `iac` → `terraform-plan`, `deploy` → `terraform-apply` | the recipient of the account cost alert, passed to Terraform as a variable |
| `TFC_API_TOKEN` | repository | `iac`, `deploy` | Terraform's access to its own state |
| `SONAR_TOKEN` | repository | `app` → `sonarqube-scan` | the quality gate's authentication |
| `VERSION_BUMP_TOKEN` | repository | `deploy` → `release` | a PAT distinct from `GITHUB_TOKEN` — **mint it fine-grained at `contents: write` and no wider**; a classic token cannot be narrowed that far, and `public_repo` is the closest it gets. It is the checkout token that pushes the bump commit and tag, and the `GH_TOKEN` that builds the notes and **creates the GitHub Release** — which the site's own footer links to, so without it that link 404s |
| `CLAUDE_CODE_OAUTH_TOKEN` | repository | `claude` | `@claude` on issues and PRs — it silently does not answer without one |

**The scope column is what the job can read, not a preference.** An **environment**-scoped secret is
invisible to a job that does not declare that environment, so putting one of the AWS ARNs at repository
scope is not the failure — omitting `environment: staging` from the job that needs it is. Repository
secrets *are* readable from environment jobs, which is why `TFC_API_TOKEN` works in `terraform-plan`
despite that job declaring `staging`.

**The split has a reason worth keeping:** anything naming AWS is environment-scoped; tooling tokens are
repository-scoped. That is what stops a token that lints code from reaching anything in the cloud account.

**Two of these are easy to miss.** `CLAUDE_CODE_OAUTH_TOKEN` produces no error anywhere — `@claude`
simply never replies. And the `staging` **environment must exist in repository settings before an
environment-scoped secret can be created at all**, which is invisible until it is missing.

### What is deliberately not here yet

Named so you can see what is absent rather than assume it was forgotten — with where it lives today:

- **the architecture diagram**, with a test holding it against the page's copy. The diagram is on
  [`/architecture`](https://tadeumendonca.io/en/architecture) today.

Two entries left this list rather than being dropped from it. The **fork-to-live walkthrough** is now
directly below, moved off `/architecture` because a page that links canonical detail should not also be a
setup guide — and the copy that lived there had gone stale describing renamed workflows, which is the
argument rather than a coincidence. The **ADR for the hand-bootstrapped trust root** is
[ADR-0042](./docs/adr/0042-trust-root-bootstrapped-out-of-band.md), which also narrows
[ADR-0014](./docs/adr/0014-terraform-cloud-pipeline-only.md)'s "no irreversible cloud mutation in the
inner loop" claim to what is actually true.

## Fork to live

**Roughly an evening, and most of it is waiting on DNS and a certificate** — the two steps below that no
amount of preparation makes faster. Everything in
[What you need before you fork](#what-you-need-before-you-fork) is assumed in place.

1. **Fork both repos.** Read the ADRs first, starting at
   [0001](./docs/adr/0001-lean-by-design-calibrated-to-strategy.md) — the decisions are the part worth
   taking, and several of them will not fit your context. If you only want the loop, stop after
   [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills): it installs with no cloud
   account, no domain and nothing to deploy, and its README is self-contained.
2. **Register the domain and create its Route 53 hosted zone.** Then request an ACM certificate **in
   `us-east-1`** — CloudFront reads certificates from that region only, wherever the rest of your stack
   lives — and **add its validation CNAMEs to the zone**, which is the part that actually makes you wait.
   Both are read as **pre-existing data sources** by [`iac/data.tf`](./iac/data.tf); Terraform never
   creates them, so a missing certificate fails the first `plan` rather than being provisioned for you.
   What this costs you is in [What it costs to run](#what-it-costs-to-run) — check the **renewal** price
   of your TLD, not just the first year.
3. **Create a Terraform Cloud organization and one workspace**, execution mode **Local**, then point
   [`iac/versions.tf`](./iac/versions.tf) at your names — **and the two `TF_WORKSPACE` values in
   `.github/workflows/`**, which is where the workspace is actually selected. There are exactly two, and
   they are not both in the same workflow: `iac.yml`'s `terraform-plan` job and `deploy.yml`'s
   `terraform-apply` job. `grep -rn 'TF_WORKSPACE:' .github/workflows/` is the check — change only
   `versions.tf` and CI still talks to *my* workspace. **Local execution is what the repo uses, not a
   recommendation:** state lives in TFC, but `plan` and `apply` run in CI, where the credentials are
   short-lived OIDC roles. Remote mode would keep credentials in the workspace, and then there are two
   places infrastructure can change from.
4. **Create the trust root by hand, before the first CI run.** Terraform creates the **fed deploy** role
   that publishes the site. It does **not** create the GitHub OIDC provider, the **infra** role that CI
   assumes to run Terraform, or that role's `tadeumendonca-iac-deploy` policy — those three are created
   out of band with the AWS CLI and stay outside Terraform permanently. So before your first CI run the
   account must already hold **five** things: the hosted zone and the `us-east-1` certificate from step 2,
   plus the provider, the infra role and its policy. Miss any of the last three and the failure is opaque
   — `Not authorized to perform sts:AssumeRoleWithWebIdentity`, which reads exactly like the
   immutable-subject trap in the next paragraph.

   **Two decisions are doing the work here, and neither is setup trivia.** *Why the trust root is
   permanently out of band* — bootstrap circularity, and the permanent one, that a role able to rewrite
   its own trust policy has no ceiling — is
   [ADR-0042](./docs/adr/0042-trust-root-bootstrapped-out-of-band.md), which also states its accepted
   costs: no `plan` detects drift on any of it, and the hand path **reopens every time that policy
   changes** rather than being a one-time act.
   [`docs/iac-deploy-policy.md`](./docs/iac-deploy-policy.md) is the standing runbook for exactly that,
   and [`docs/iac-deploy-policy.json`](./docs/iac-deploy-policy.json) is the desired document to apply.
   *Why the role's trust names an **immutable** subject* — `repo:<org>@<org_id>/<repo>@<repo_id>:*`, by
   numeric ID rather than by name, since a name can be transferred and the IDs cannot — is
   [ADR-0015](./docs/adr/0015-oidc-immutable-subject-least-privilege.md). Its cost is that the safer form
   is not copy-pasteable: you have to look your own IDs up.
5. **Wire the GitHub secrets.** All seven are in
   [GitHub secrets and variables](#github-secrets-and-variables) above, with the scope each one takes and
   the job that reads it — **that table, not a second copy of it here.** The one thing to carry forward
   while you work through it: anything naming AWS is **environment**-scoped, tooling tokens are
   **repository**-scoped, and the `staging` environment has to exist in repository settings before an
   environment secret can be created at all.
6. **Replace the content and the positioning.** [`apps/fed/src/content/`](./apps/fed/src/content) for the
   long-form, `src/data/profile.ts` for the CV, `src/data/catalog.ts` for the portfolio,
   `src/i18n/messages.ts` for the chrome. Every reader-facing module is typed so that a missing
   translation is a **compile error** rather than a page that quietly serves the wrong language.
7. **Merge to `main`.** The merge *is* the deploy — there is no promote step and no second environment to
   catch what the pull request missed. That is the trade the whole architecture makes, and it is only
   safe because the gates run on the PR.

## Structure

```
apps/
  fed/    # the static SPA (React + Vite + Tailwind, no PWA)
docs/
  adr/    # the decision library — the architecture documentation; start at 0001
iac/      # Terraform for the frontend infra (S3, CloudFront, email, OIDC roles)
          # plus one account-wide cost budget, deliberately not scoped to this project
LICENSE   # the MIT grant, exact text so GitHub can classify it
NOTICE    # the boundary of that grant — the editorial content is reserved
VERSION   # single version (numeric SemVer)
```

## Licence

**MIT on the software, editorial content reserved.** The machinery — the SPA, `iac/`, the build scripts,
the workflows — is yours to fork and ship, and so are **the decision records** (`docs/adr/**`,
`catalog-ready.md`, the IaC policy): a fork that takes the structure without the reasoning takes the
weaker half. The writing and the CV are not: they are published to be read, not relicensed. Reserved is
the default — the MIT side wins only where `NOTICE` names something.

[`LICENSE`](./LICENSE) is the MIT grant, kept as the exact MIT text so GitHub can classify it.
[`NOTICE`](./NOTICE) is the boundary of that grant — what is reserved, and which paths illustrate it.
**Read them together; neither is complete alone.**

## Workflow (trunk-based)

- **`main`** is the only branch. Feature/fix branches cut from `main` → PR → merge → **automatic deploy** to the
  single environment; the site serves at the apex `tadeumendonca.io`.
- Single version (root `VERSION`, tags `vX.Y.Z`); the deploy's `release` job auto-bumps the patch on every
  push to `main`.

## CI (`.github/workflows/`)

**Four workflows, named after the top-level directory each one gates** — full map, with diagrams, in
[`.github/workflows/README.md`](./.github/workflows/README.md).

- **`app`** (`apps/**`) — `npm-ci` → `npm-audit` · `eslint` · `tsc` · `vitest` · `build-static` →
  `playwright` · `sonarqube-scan`, behind a terminal **`build-test`** aggregator. Its filter also carries
  **`iac/cloudfront-functions/**`**, which is load-bearing rather than a stray: the CloudFront rewrite
  function is JS with behaviour, so it is unit-gated here. It stays in `iac`'s filter too — that file is
  also a Terraform diff, and the two gates prove different things.
- **`iac`** (`iac/**`) — credential-free `checkov` and `terraform-fmt`, then **`terraform-plan`**
  (init + validate + plan), the only job holding an AWS token.
- **`github`** (`.github/**`) — **`actionlint`** + shellcheck.
- **`deploy`** (push to `main`) — `release` → `gate` → `terraform-apply` / `deploy-app` → `e2e` against
  the live apex.

Each PR workflow runs on **every** PR and applies its path filter inside the job, then reports whether it
skipped, failed part-way, or ran in full — a check that matched nothing must not read like one that passed.

## Related repos

- [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) — Claude Code skills library (plugin + marketplace), whose principles layer this repo consumes.
