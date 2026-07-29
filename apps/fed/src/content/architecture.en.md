_This site is the argument. This page is the blueprint — how it's built, and how you'd build your own._

## The thesis

For a proof-of-engineering site, the code is the pitch — so the honest thing is to show the machine, not just its output. This is the whole build, in the open: the architecture below, the decisions that shaped it (each one recorded as an ADR), and the reusable layer that lets you replicate it. I build this the way I want to be hired to build — AI-native development (Claude Code, Kiro, an AI-DLC / Loop Engineering loop) with the SDLC rigor most AI work skips. The site is that loop's public output.

## The shape

A fully static SPA — React + Vite + TypeScript — served from **S3 behind CloudFront**, with a small CloudFront Function rewriting clean URLs. No backend: no server, no database, no auth. Cost near-zero, attack surface minimal, nothing to keep running at 3am. *(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) fully static / no backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

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

**The bar:** a project only earns the portfolio when it clears **[docs/catalog-ready.md](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md)** — the proof-of-engineering gate. This site is the one entry that did not graduate onto that shelf, because it *is* the shelf; the bar says so, and says what holds it instead. Hold your own work to it.

**Start here:** fork the two repos, read the ADRs (start at 0001), adopt the skills plugin as your loop, then swap in your own content and positioning. The structure carries; the words are yours.

## One honest limitation

This is a single-author site, tuned to one person's positioning — not a general-purpose template, and not battle-tested across many hands yet. Take the pattern, not the specifics. What's next, deferred on purpose: a richer visual blueprint and a step-by-step replicate walkthrough — this page is the map, not yet the guided tour.
