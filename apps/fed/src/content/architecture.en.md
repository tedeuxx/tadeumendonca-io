_This site is the argument. This page is the blueprint — how it's built, and how you'd build your own._

## The thesis

For a proof-of-engineering site, the code is the pitch — so the honest thing is to show the machine, not just its output. This is the whole build, in the open: the architecture below, the decisions that shaped it (each one recorded as an ADR), and the reusable layer that lets you replicate it. I build this the way I want to be hired to build — AI-native development (Claude Code, Kiro, an AI-DLC / Loop Engineering loop) with the SDLC rigor most AI work skips. The site is that loop's public output.

## The shape

A fully static SPA — React + Vite + TypeScript — served from **S3 behind CloudFront**, with a small CloudFront Function rewriting clean URLs. No backend: no server, no database, no auth. Cost near-zero, attack surface minimal, nothing to keep running at 3am. *(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) fully static / no backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

## What it actually costs: USD 6.57 a month, and USD 6.42 of that is the name

"Near-zero" is the easiest claim on this page to make and the easiest to leave unchecked. So here is the whole bill — the serving lines read from the account's daily cost in **late July 2026**, the registration read from the registrar's price list, neither estimated:

- **The domain** — USD 71.00/yr for the `.io`, an annual charge that lands in one month. **USD 5.92/month** amortized.
- **Route 53** — USD 0.50/month, fixed. The hosted zone, whether or not anyone visits.
- **S3** — about USD 0.15/month, and it is deploy *writes*, not reads.
- **CloudFront** — effectively USD 0.00 at this traffic.

Note the shape, because it is not a small effect and it is a three-way split rather than a ratio: **the name is 6.42, publishing is 0.15, and answering requests is zero.** Registration and DNS cost more than everything else on this page combined, forty times over; the 0.15 is the build pushing files to S3, not readers pulling them; and the part that actually serves a visitor rounds to nothing.

Treat the serving lines as a measurement with a date on it rather than a standing fact — no invoice has closed at that rate yet. And note *why* the sourcing is split, because it is the mistake this section already made once: the daily cost series is a window, and **a charge that recurs less often than your window is long is invisible to it.** The renewal is annual and falls in October, so reading the account was correct and answered a different question than the one asked. "Measured, not estimated" is not a defence against measuring the wrong interval. There is no compute line at all, and that is what "no backend" buys: a **floor** of zero, nothing billing while nobody visits. It does not buy indifference to traffic — S3 and CloudFront are purely usage-priced, so the variable part is zero here because of the free tier and small payloads, not because there is nothing to scale.

### What the guardrail is actually for

The same reading turned up roughly **USD 12.80 a month** the site was not using: WAF web ACLs and idle public IPv4 addresses attached to nothing, left behind when the backend was retired. Twice what the whole site costs, and more than eighty times what publishing it does. **Those are gone** — removed in July 2026, and the daily cost series confirms the charges stop rather than an empty console implying it. Not all of it: a residue from the same era, **under a dollar a month**, is still accruing while I work out what it holds — an account-level line, not a site one, and the honest state of this at the time of writing.

I found them by reading the bill, which is late. So what watches now is an account-wide budget in `iac/budget.tf`, and two things about it are deliberate. It is **not** scoped to this project's tags — otherwise it would only ever see spend this repo created, and this was exactly the kind it did not. And the sensitivity lives in the **thresholds**, not the ceiling: a ceiling has to be sized for your worst legitimate month, which here is the October renewal, so it is by construction deaf to anything smaller than itself. The alarm that matters fires at 15% — around USD 12, quiet at the normal run rate, and awake to any new recurring cost of roughly USD 8/month. A conventional 50/80 pair would first have spoken at USD 40, several times actual spend, and stayed silent for a year about a new USD 30/month service.

That is the transferable part, and it is two-sided: infrastructure you stop using does not stop billing, and the thing meant to catch it has to look **wider** than what you are building and **lower** than what you are afraid of. *(→ [`iac/budget.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/budget.tf))*

## Content is markdown in the repo, resolved at build

Every page's content — the CV, this page, the articles — is markdown or typed data in the repo. Each route is **prerendered** at build (a headless snapshot) so the OG/SEO tags and crawlable HTML land in the served files — no SSR, no edge rendering. The downloadable CV PDF is printed from the live `/me` by the same step. *(→ [ADR-0004](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0004-build-time-render-not-ssr-or-edge.md) build-time render · [ADR-0005](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0005-og-coverage-every-public-url.md) every URL OG-complete · [ADR-0034](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0034-build-time-cv-pdf-static-artifact.md) the CV PDF)*

## The dev-loop is the product

The interesting part isn't the stack — it's how it's built: **agent-led verification, human-residual**. The agent proves "done" with mechanical gates and real evidence (lint, types, tests ≥85%, a green build, SonarCloud, functional E2E, a fresh-context reviewer); the human keeps the irreversible and architectural calls. That loop lives in a separate reusable plugin — **[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)** — so it's a methodology you can adopt, not something bespoke to this site. *(→ [ADR-0003](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0003-trunk-based-single-environment.md) trunk-based single-environment · [ADR-0018](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0018-ci-gates-e2e-on-pr-coverage.md) the CI gates)*

## The decision record IS the documentation

No separate architecture doc that drifts. Every load-bearing decision — and the reversed ones, kept as history — is an **[Architecture Decision Record](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/README.md)**, read through the keystone [ADR-0001](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0001-lean-by-design-calibrated-to-strategy.md): *lean by design, calibrated to strategy.* The real "why" behind anything above is there, dated, with its trade-off.

## Replicate it for your own context

It's all public — two repos, no secrets:

- **[tadeumendonca-io](https://github.com/tedeuxx/tadeumendonca-io)** — this site and its infrastructure (`iac/`: Terraform for S3/CloudFront/OIDC).
- **[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)** — the reusable dev-loop plugin: the principles, the agent personas, the permission guards.

**The bar:** a project only earns the portfolio when it clears **[docs/catalog-ready.md](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md)** — the proof-of-engineering gate. This site is the one entry that did not come through it, because it *is* the shelf; what holds it up is on this page — the ADRs above, the gates, and the limitation it states about itself below. Hold your own work to it.

### The walkthrough

Roughly an evening, most of it waiting on DNS and a certificate.

1. **Fork both repos.** Read the ADRs first, starting at 0001 — the decisions are the part worth taking, and several of them will not fit your context.
2. **Register the domain and create its Route 53 hosted zone.** Your cost floor starts here and it is mostly the name, not the hosting — check the renewal price of the TLD you picked, not just the first year. Then request an ACM certificate **in `us-east-1`** — CloudFront reads certificates from that region only, wherever the rest of your stack lives — and **add its validation CNAMEs to the zone**, which is the part that actually makes you wait.
3. **Create a Terraform Cloud organization and one workspace**, execution mode **Local**, then point `iac/versions.tf` at your names — **and the `TF_WORKSPACE` in the two infra workflows**, which is where the workspace is actually selected. Change only the first and CI still talks to mine. This is what the repo uses, not a recommendation: state lives there, but plan and apply run in my CI, where the credentials are short-lived OIDC roles. Remote mode would keep credentials in the workspace — and then there are two places infrastructure can change from.
4. **Bootstrap by hand what CI cannot bootstrap for itself**, and be precise about which pieces those are, because "run it once locally" is not the whole story. Terraform here creates the **deploy** role that publishes the site. It does **not** create the GitHub OIDC provider, and it does **not** create the infra role that runs Terraform itself — not because managing it is impossible, but because its first run would need the credential it has not created yet, and because a role that can rewrite its own trust policy is a role with no ceiling on it; [`docs/iac-deploy-policy.md`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/iac-deploy-policy.md) is its runbook. Get those two in place first, or your first CI run has nothing to assume. This is the one honest exception to *apply is pipeline-only* — and afterwards, take the local credentials away and never apply from a laptop again.
5. **Wire the GitHub secrets, and mind which scope each one takes.** Anything that names AWS — `AWS_FED_OIDC_ROLE_ARN`, `AWS_INFRA_OIDC_ROLE_ARN`, and the budget alert address `BUDGET_ALERT_EMAIL` — is an **environment** secret; the tooling tokens — `TFC_API_TOKEN`, `SONAR_TOKEN`, `VERSION_BUMP_TOKEN` — are **repository** secrets. The split is what keeps a token that lints your code from reaching anything in your account.
6. **Fix the trust policy's subject, and expect this one to bite.** The roles trust an *immutable* subject — `repo:<org>@<org_id>/<repo>@<repo_id>:*`, by numeric ID, not by name. The plain `repo:<org>/<repo>:*` form is a name, and a name can be transferred to someone else; the IDs cannot. The cost of the safer form is that it is not copy-pasteable — you have to look your IDs up.
7. **Replace the content and the positioning.** `src/content/` for the long-form, `src/data/profile.ts` for the CV, `src/data/catalog.ts` for the portfolio, `src/i18n/messages.ts` for the chrome. Every reader-facing module is typed so that a missing translation is a **compile error** rather than a page that quietly serves the wrong language.
8. **Merge to `main`.** The merge *is* the deploy — there is no promote step and no second environment to catch what the pull request missed. That is the trade the whole architecture makes, and it is only safe because the gates run on the PR.

The part I would be nervous seeing someone copy without the rest is **merging straight to production**. Trunk-based with a single environment is fast and unforgiving in equal measure; without the gates in front of it, only the second half survives.

## One honest limitation

This is a single-author site, tuned to one person's positioning — not a general-purpose template, and no one else's hands have been on it. Take the pattern, not the specifics. What's next, deferred on purpose: a richer visual blueprint — the walkthrough above is prose describing a system, and prose is not a diagram.
