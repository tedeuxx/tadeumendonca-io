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

**Two of these cost money, and that is the honest front of this pitch.** A reader four steps into a
walkthrough should not be the one to discover that.

### Accounts

| | free at this size? | why you need it |
|---|---|---|
| **AWS account** | **no** — see the cost breakdown below | S3, CloudFront, Route 53, ACM |
| **A registered domain** | **no** — the largest single line in this site's bill | the site serves at an apex you own |
| **GitHub account** | yes | the repo, and CI is GitHub Actions |
| **Terraform Cloud org** | yes — the free tier covers this workspace, and stops being enough past 5 users or if you want remote execution or policy enforcement | Terraform state; execution mode is **Local**, so TFC holds state and CI runs the plan |
| **SonarCloud account** | yes — **because the repo is public.** A private fork needs a paid plan | the quality gate on `app` |
| **Claude Code** | **no** — a paid Anthropic plan | only if you want the *loop*, not the site. See [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) |

**The site runs without Claude Code.** The plugin repo is the half you can adopt with no cloud account
and no AWS bill at all — it has neither.

### Local toolchain

- **Node ≥ 22** (`engines` in `package.json`) and npm.
- **Terraform CLI** — for `fmt`/`validate` and an inspection `plan`. You will never run `apply` locally:
  it is pipeline-only, and the plugin's permission hook denies it.
- **Playwright browsers** — the build downloads them; `npm ci` in `apps/fed` then `npx playwright install`.
  The build *prerenders every route in a real browser*, so this is a build dependency, not a test one.

### What it costs to run

Roughly **USD 6.57/month**, and **USD 6.42 of that is the domain name** — registration amortized plus the
Route 53 hosted zone. S3 is about 0.15 (deploy *writes*, not reads) and CloudFront rounds to zero at this
traffic. The full breakdown, with its measurement date and the reason it is split between the bill and the
registrar's price list, is on [`/architecture`](https://tadeumendonca.io/en/architecture).

## Deploying your own fork

> **Honesty about this walkthrough:** the **secrets table below is machine-derived** — read out of
> `.github/workflows/*.yml`, not from memory. The **steps are reconstructed from the repository**, not
> replayed against a fresh AWS account and domain. Where a step names a failure, that failure is one this
> repo actually hit. Treat the ordering as sound and the timings as approximate.

1. **Fork both repos** — this one, and [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills)
   if you want the loop. They are independent: the site does not import the plugin at build time.
2. **Register a domain and create the Route 53 hosted zone**, then point the registrar's nameservers at it.
   Propagation is not instant and nothing later works until it has happened.
3. **Request the ACM certificate in `us-east-1`.** *This is the step that catches people.* CloudFront reads
   certificates only from `us-east-1` regardless of where the rest of your infrastructure lives — a
   certificate issued in your "own" region is invisible to it, and the failure surfaces as CloudFront
   refusing the alias, not as a certificate error. Validation is by CNAME and you wait for it.
4. **Bootstrap the GitHub OIDC provider and the roles CI assumes — by hand, once.** Terraform does not
   create them, and that is deliberate rather than an omission: the roles are what CI uses *to run
   Terraform*, so having Terraform create them is a chicken-and-egg. Pin the trust policy to the
   **immutable OIDC subject** — `repo:<org>@<org_id>/<repo>@<repo_id>:*` — never a wildcard and never the
   name form. A repo or org **rename silently breaks every assume-role** if you trust the names.
5. **Create the Terraform Cloud organization and workspace**, execution mode **Local**. Rename the
   workspace in `iac/` to yours.
6. **Create the `staging` environment in repository settings, then add the secrets** — see the table
   below. **The environment must exist first**: an environment-scoped secret cannot be created without it,
   and this is invisible until it is missing.
7. **Replace everything that identifies this site as mine.** Miss one and your fork publishes to my
   analytics or my Sonar project:
   - the site URL in [`apps/fed/src/lib/site.ts`](./apps/fed/src/lib/site.ts);
   - the GitHub / LinkedIn / X handles in [`apps/fed/src/data/profile.ts`](./apps/fed/src/data/profile.ts);
   - the GA4 measurement id — `VITE_GA_MEASUREMENT_ID` in
     [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). **It is deliberately not a secret**:
     it ships in the client JS, so hiding it would be theatre. It is also the one most likely to be missed,
     because nothing fails — your readers are simply counted as mine;
   - `sonar.projectKey` and `sonar.organization` in
     [`apps/fed/sonar-project.properties`](./apps/fed/sonar-project.properties);
   - the Terraform Cloud organization and workspace in [`iac/versions.tf`](./iac/versions.tf) — that file
     warns you itself: those identifiers resolve to **live state**, so changing them without renaming in
     TFC first makes `plan` propose recreating the whole site;
   - the domain and the rest in [`iac/env/stg.tfvars`](./iac/env/stg.tfvars).
8. **Merge to `main`.** The merge *is* the deploy: `release` bumps the version and tags, `terraform-apply`
   builds the infrastructure, `deploy-app` publishes, and `e2e` runs against the live apex. **The first run
   is the one that fails informatively** — if step 4 was skipped, the AWS-token jobs cannot assume a role
   and nothing else in the pipeline explains why.

### GitHub secrets and variables

Read out of the workflows, not from memory — `grep -o 'secrets\.[A-Z_]*' .github/workflows/*.yml` returns
these seven, and three jobs declare `environment: staging` (`iac` → `terraform-plan`, `deploy` →
`terraform-apply`, `deploy` → `deploy-app`).

| secret | scope | consumed by | what breaks without it |
|---|---|---|---|
| `AWS_FED_OIDC_ROLE_ARN` | **environment** (`staging`) | `deploy` → `deploy-app` | the site never publishes |
| `AWS_INFRA_OIDC_ROLE_ARN` | **environment** (`staging`) | `iac` → `terraform-plan`, `deploy` → `terraform-apply` | no plan on PRs, no infra apply |
| `BUDGET_ALERT_EMAIL` | **environment** (`staging`) | `iac` → `terraform-plan`, `deploy` → `terraform-apply` | the account budget alert has no recipient |
| `TFC_API_TOKEN` | repository | `iac`, `deploy` | Terraform cannot reach its state |
| `SONAR_TOKEN` | repository | `app` → `sonarqube-scan` | the quality gate cannot authenticate |
| `VERSION_BUMP_TOKEN` | repository | `deploy` → `release` | the bump lands and **triggers nothing** — see below |
| `CLAUDE_CODE_OAUTH_TOKEN` | repository | `claude` | `@claude` silently does not answer |

**The scope column is not a preference — it is what the job can read.** A secret placed at repository
scope when the job expects the environment fails at the point of use, not at setup.

**The split has a reason:** anything naming AWS is environment-scoped; tooling tokens are repository-scoped.
That is what keeps a token that lints code from reaching anything in the cloud account.

**`VERSION_BUMP_TOKEN` deserves its own sentence**, because its failure is the quietest one here. A push
made with the default `GITHUB_TOKEN` **does not trigger other workflows** — so without a separate token the
version bumps, the commit lands, and the deploy never fires. Nothing errors.

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
