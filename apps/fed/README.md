# apps/fed

The static SPA for [tadeumendonca.io](https://tadeumendonca.io) — a content-first landing, an interactive CV,
a portfolio that links to a curated catalog of automations/agentic tools, and long-form articles. Fully static,
no backend. Part of the [`tadeumendonca-io`](../../README.md) repo (sibling: `iac`, the Terraform).

## Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind v3 (no shadcn/ui) — own components in `src/components/`, HSL tokens, `cn()` helper
- **Routing**: react-router v6 · **Icons**: lucide-react · React Query is present for local/async state, not
  for fetching — there is nothing to fetch at runtime
- **Content**: in the repo, in two shapes — **markdown** for long-form (`react-markdown` + `rehype-highlight`
  + `js-yaml` frontmatter, sanitized with `dompurify`, loaded at build via `import.meta.glob`) and **typed
  TypeScript** for structured data (`src/data/profile.ts` is the CV, `catalog.ts` the portfolio)
- **SEO/OG**: every route is **prerendered** at build, **in both locales** (Playwright snapshot of
  `vite preview`), so meta/OG tags are in the served HTML. `/cv.pdf` is printed from `/en/me` in the same pass
- **Fonts**: self-hosted `@fontsource` (Space Grotesk + JetBrains Mono)
- **Tests**: Vitest + React Testing Library (queries by role/text; no snapshots) · **E2E**: Playwright
- **Hosting**: AWS S3 + CloudFront (see `../../iac`)

## Architecture

**Fully static** — no backend, no PWA, no API, no auth, no database. Content is in the repo, rendered
client-side and prerendered at build for SEO/OG.

**Every public URL carries a locale prefix** — `/pt/…` and `/en/…` — and **the path is authoritative**, so a
shared link keeps its language regardless of the reader's browser (ADR-0036). The bare root `/` is the one
deliberate exception: it is prerendered in English as the `x-default` entry for a JS-less crawler.

Routes (`scripts/routes.mjs` is the build-time source of truth):

- `/` — the **landing**: a content-first shop window (hero + articles + portfolio shortlist + contact).
  It also hosts the articles list under `#artigos` — there is no separate blog index.
- `/me` — the **interactive CV**, and the only CV surface. `/cv.pdf` is the one-page recruiter edition
  printed from it at build time (ADR-0034).
- `/portfolio` — the full curated catalog.
- `/ramp-up` — the open plan for the AI-Engineer transition.
- `/architecture` — how the site is built, linking the ADRs and both public repos.
- `/blog/:slug` — the **canonical article**, with a **per-locale slug** (ADR-0037): the two editions of one
  article carry different URLs.
- Redirects: `/blog` → the landing's `#artigos`; unprefixed paths → the reader's edition; `*` → the locale
  landing.

## Visual identity (single theme, no dark/light toggle)

Brutalist mono: near-black `#0A0A0A` / warm off-white `#F5F4EF` + one accent, **safety orange `#FF5A00`**.
Radius 0, no shadow, no gradient; a visible 12-column grid. Tokens in `src/styles/index.css` (single `:root`)
and `tailwind.config.js`. Typography: **Space Grotesk** for display/body, **JetBrains Mono** for mono/labels.
One carved exception to radius 0: the portrait, via the hand-written `.avatar-round` utility (ADR-0008
amendment) — deliberately not reachable through Tailwind, so the guard stays intact.

## Language

**The site is bilingual — pt-BR and en** (ADR-0032), and **both locales are prerendered** (ADR-0036). There is
no i18n framework: a typed in-repo catalog (`src/i18n/`) with `LocaleProvider`, `useT()` and `useLocale()`.

**Everything a reader reads is authored in both languages** — chrome, CV, catalog copy and long-form prose
alike. In every reader-facing module a **missing translation is a compile error**: `messages.ts` via its
`satisfies`, `profile.ts` via `ProfileSource`, `catalog.ts` and `repoCards.ts` via a leaf
`Record<Locale, string>`, and the blog loader by throwing at module load.

Long-form uses **one markdown file per locale** — `<name>.pt.md` / `<name>.en.md` — deliberately *not* the
key-first `{ pt, en }` shape: a paragraph is not a leaf, and interleaving two languages in one document makes
both unreadable to edit. Two files can drift where an object cannot, so parity is asserted in tests.

**English is the canonical edition** (ADR-0024): it is what LinkedIn carries and what `/cv.pdf` is printed
from. Facts — dates, employers, official titles, certification names — are authored **once** and shared, so
the two editions cannot disagree.

(Everything published on GitHub — this file, commit and PR text — is written in English.)

## Conventions

- **camelCase** frontmatter keys in markdown (`title`, `slug`, `date`, `tag`, `track`, `excerpt`, `takeaway`).
- Explicit UI states (loading/empty/error) via primitives in `src/components/Column.tsx`. There is no form
  component — the site has no inputs; contact is a set of links.
- The blog's canonical route is `/blog/:slug`; the list lives on the landing under `#artigos`.
- Never hardcode a UI string: every one goes in `src/i18n/messages.ts`, in both locales.

## Commands

```bash
npm run dev            # vite dev server (localhost:5173)
npm test               # vitest run --coverage — ≥85% is a gate, as a GLOBAL AVERAGE, not per file
                       # (ADR-0018 amendment): a weak file passes if the whole clears it
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run build          # tsc + vite build
npm run build:static   # build + prerender both locales + print /cv.pdf — the deploy artifact
npm run e2e:local      # build:static, THEN Playwright against a preview. This is the local gate and it
                       # matches CI exactly
npm run e2e:local:built  # skips the build; use right after one (vite build empties dist/)
npm run e2e:production   # ⚠️ drives the LIVE apex on purpose
```

**One spec is post-deploy-only and SKIPS locally** — `e2e/edge-rewrite.spec.ts`. It proves the CloudFront
rewrite function is attached and running at the edge, which `vite preview` cannot do. It reports **skipped**,
never passed, where it cannot run: a check that did not run must not read like one that did.

## Workflow (trunk-based · `trunk-single-env`)

Branch from `main`; PR required (0 approvals). Merge to `main` → **automatic deploy** to the single
environment (the site serves at the apex `tadeumendonca.io`).

The PR gate (`build-test`) runs a dependency audit → lint → typecheck → test (coverage ≥85%) → `build:static`
→ E2E → the SonarCloud quality gate. It is path-filtered to `apps/fed/**` **and `iac/cloudfront-functions/**`,
which is load-bearing: the CloudFront rewrite function is JS with behaviour, so it is unit-gated here rather
than by `infra-plan`.

See the [repo README](../../README.md) for the full picture, and `CLAUDE.md` for the working rules.
