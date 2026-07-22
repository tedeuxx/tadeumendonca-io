# apps/fed

The static SPA for [tadeumendonca.io](https://tadeumendonca.io) — a content-first landing, an interactive CV,
a portfolio that links to a curated catalog of automations/agentic tools, and a blog. Fully static, no backend.
Part of the [`tadeumendonca-io`](../../README.md) repo (sibling: `iac`, the Terraform).

## Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind v3 (no shadcn/ui) — own components in `src/components/`, HSL tokens, `cn()` helper
- **Routing**: react-router v6 · **Data**: React Query · **Icons**: lucide-react
- **Content**: **markdown in the repo** — `react-markdown` + `rehype-highlight` + `js-yaml` frontmatter,
  sanitized with `dompurify`. Loaded at build via `import.meta.glob`.
- **SEO/OG**: each route is **prerendered** at build (Playwright snapshot of `vite preview`), so meta/OG tags
  are in the served HTML.
- **Fonts**: self-hosted `@fontsource` (Space Grotesk + JetBrains Mono)
- **Tests**: Vitest + React Testing Library (queries by role/text; no snapshots) · **E2E**: Playwright
- **Hosting**: AWS S3 + CloudFront (see `../../iac`)

## Architecture

**Fully static** — there is no backend, no PWA. Content (CV, articles) is markdown in the repo, rendered
client-side and prerendered at build for SEO/OG. No API, auth, or database. Routes:

- `/` — the **landing**: a content-first shop window (hero + articles + portfolio shortlist + contact). Not the CV.
- `/cv` — the **CV** (name, experience, education, skills).
- `/portfolio` — the full curated catalog.
- `/blog/:slug` — the **canonical article** (with OG). `/articles/:slug` kept for deep-link compat.
- Redirects: `/blog` and `/articles` → `/#artigos`; `/profile` → `/cv`; `*` → `/`.

## Visual identity (single theme, no dark/light toggle)

Brutalist mono: near-black `#0A0A0A` / warm off-white `#F5F4EF` + one accent, **safety orange `#FF5A00`**.
Radius 0, no shadow, no gradient; a visible 12-column grid. Tokens in `src/styles/index.css` (single `:root`)
and `tailwind.config.js`. Typography: **Space Grotesk** for display/body, **JetBrains Mono** for mono/labels.

## Language

The whole site UI is **pt-BR** (content, not a GitHub publication). No i18n framework — inline strings, `pt-BR`
date locale. New UI text is written in pt-BR. (A bilingual EN/PT phase is planned but not built — see
`docs/redesign/redesign-plan.md`.)

## Conventions

- **snake_case** in content/data (markdown frontmatter); no mapping layer.
- Explicit UI states (loading/empty/error) via primitives in `src/components/Column.tsx`; forms via
  `src/components/Form.tsx`.
- The blog's canonical route is `/blog/:slug`; the list lives on the landing under `#artigos`.

## Commands

```bash
npm run dev          # vite dev server (localhost:5173)
npm test             # vitest run --coverage — gate ≥85%
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # tsc + vite build
npm run build:static # build + prerender each route for OG/SEO
npm run e2e:local    # Playwright against a local vite preview
```

## Workflow (trunk-based · `trunk-single-env`)

Branch from `main`; PR required (0 approvals). Merge to `main` → **automatic deploy** to the single environment
(the site serves at the apex `tadeumendonca.io`). The PR gate (`build-test`) runs lint + typecheck + test (coverage
≥85%) + build + the SonarCloud quality gate. See the [repo README](../../README.md) for the full picture.
