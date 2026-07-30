_This site is the argument. This page is the blueprint — how it's built, and how you'd build your own._

## The thesis

For a proof-of-engineering site, the code is the pitch — so the honest thing is to show the machine, not just its output. This is the whole build, in the open: the architecture below, the decisions that shaped it (each one recorded as an ADR), and the reusable layer that lets you replicate it. I build this the way I want to be hired to build — AI-native development (Claude Code, Kiro, an AI-DLC / Loop Engineering loop) with the SDLC rigor most AI work skips. The site is that loop's public output.

## The shape

A fully static SPA — React + Vite + TypeScript — served from **S3 behind CloudFront**, with a small CloudFront Function rewriting clean URLs. No backend: no server, no database, no auth. Cost near-zero, attack surface minimal, nothing to keep running at 3am. *(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) fully static / no backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

## What it actually costs: about USD 0.65 a month

"Near-zero" is the easiest claim on this page to make and the easiest to leave unchecked, so here is the bill, read from the account rather than estimated:

- **Route 53** — USD 0.50/month, fixed. The hosted zone, whether or not anyone visits.
- **S3** — about USD 0.15/month, and it is deploy *writes*, not reads.
- **CloudFront** — effectively USD 0.00 at this traffic.

Note the shape, because it is the honest one for a static site: **the domain costs more than serving the site does.** There is no compute line at all — that is what "no backend" buys, and it is why the figure barely moves whether ten people visit or ten thousand. CloudFront on `PriceClass_100` and objects on S3 have no idle cost to pay.

The guardrail is an account-wide budget in `iac/budget.tf`, deliberately **not** scoped to this project's tags — so it catches spend this repo did not create. That is not paranoia: this account was carrying roughly **USD 12.80 a month** of leftovers from the retired backend era — WAF web ACLs and idle public IPv4 addresses attached to nothing — which is twenty times the site's own cost. Infrastructure you stop using does not stop billing, and nothing tells you except the bill. *(→ [`iac/budget.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/budget.tf))*

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
2. **Register the domain and create its Route 53 hosted zone.** That USD 0.50 is your cost floor from this moment on, before a single visitor. Request an ACM certificate **in `us-east-1`** — CloudFront reads certificates from that region only, wherever the rest of your stack lives.
3. **Create a Terraform Cloud organization and one workspace**, execution mode **Local**, then point `iac/versions.tf` at your names. State lives there; the plan runs in CI.
4. **Bootstrap the OIDC roles once, from your own credentials.** This is the one honest exception to *apply is pipeline-only*, and it is a genuine chicken-and-egg: CI assumes roles that Terraform creates, so the first apply cannot come from CI. After it lands, take the local credentials away and never apply from a laptop again.
5. **Wire the GitHub secrets, and mind which scope each one takes.** Role ARNs — `AWS_FED_OIDC_ROLE_ARN`, `AWS_INFRA_OIDC_ROLE_ARN` — are **environment** secrets; tooling tokens — `TFC_API_TOKEN`, `SONAR_TOKEN`, `VERSION_BUMP_TOKEN`, `BUDGET_ALERT_EMAIL` — are **repository** secrets. The split is what keeps a token that lints your code from being able to touch your account.
6. **Fix the trust policy's subject, and expect this one to bite.** The roles trust an *immutable* subject — `repo:<org>@<org_id>/<repo>@<repo_id>:*`, by numeric ID, not by name. The plain `repo:<org>/<repo>:*` form is a name, and a name can be transferred to someone else; the IDs cannot. The cost of the safer form is that it is not copy-pasteable — you have to look your IDs up.
7. **Replace the content and the positioning.** `src/content/` for the long-form, `src/data/profile.ts` for the CV, `src/data/catalog.ts` for the portfolio, `src/i18n/messages.ts` for the chrome. Every reader-facing module is typed so that a missing translation is a **compile error** rather than a page that quietly serves the wrong language.
8. **Merge to `main`.** The merge *is* the deploy — there is no promote step and no second environment to catch what the pull request missed. That is the trade this whole shape makes, and it is only safe because the gates run on the PR.

**If you take one thing, take step 8 with its gates attached.** Trunk-based with a single environment is fast and unforgiving in equal measure; without the checks in front of it, it is only the second.

## One honest limitation

This is a single-author site, tuned to one person's positioning — not a general-purpose template, and not battle-tested across many hands yet. Take the pattern, not the specifics. What's next, deferred on purpose: a richer visual blueprint — the walkthrough above is now written, but it is still prose describing a system, not a diagram of one.
