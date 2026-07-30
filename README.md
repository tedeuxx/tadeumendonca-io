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
   `/cv.pdf` is the one-page recruiter edition printed from it at build time.
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

## Structure

```
apps/
  fed/    # the static SPA (React + Vite + Tailwind, no PWA)
docs/
  adr/    # the decision library — the architecture documentation; start at 0001
iac/      # Terraform for the frontend infra (S3, CloudFront, email, OIDC roles)
          # plus one account-wide cost budget, deliberately not scoped to this project
LICENSE   # MIT on the code; the editorial content is reserved — see the file
VERSION   # single version (numeric SemVer)
```

## Licence

**MIT on the software, editorial content reserved.** The code — the SPA, `iac/`, the build scripts, the
workflows — is yours to fork and ship. The writing and the CV are not: they are published to be read, not
relicensed. `LICENSE` states the split and which paths fall on each side.

## Workflow (trunk-based)

- **`main`** is the only branch. Feature/fix branches cut from `main` → PR → merge → **automatic deploy** to the
  single environment; the site serves at the apex `tadeumendonca.io`.
- Single version (root `VERSION`, tags `vX.Y.Z`); `version-main` auto-bumps patch on every push to `main`.

## CI (`.github/workflows/`)

`build-test` (dependency audit + lint + typecheck + test ≥85% + build + E2E + SonarCloud; path-filtered to
`apps/fed/**` **and `iac/cloudfront-functions/**`** — that second path is load-bearing, not a stray: the
CloudFront rewrite function is JS with behaviour, so it is unit-gated here rather than by `infra-plan`);
`infra-plan`
(checkov + `plan`, path-filtered to `iac/`); `lint-workflows` (actionlint + shellcheck over
`.github/workflows/**`). Each runs on **every** PR and applies its path filter inside the job, then reports
whether it skipped, failed part-way, or ran in full — a check that matched nothing must not read like one
that passed.
Deploys: `deploy` / `infra-apply` on merge to `main`.

## Related repos

- [`tadeumendonca-skills`](https://github.com/tedeuxx/tadeumendonca-skills) — Claude Code skills library (plugin + marketplace), whose principles layer this repo consumes.
