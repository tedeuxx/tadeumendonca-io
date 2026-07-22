# apps/fed

The static SPA for [tadeumendonca.io](https://tadeumendonca.io) — an interactive CV (home), a portfolio that
links to a curated catalog of automations/agentic tools, and a blog. An installable, **offline-first PWA**.
Part of the [`tadeumendonca-io`](../../README.md) repo (sibling: `iac`, the Terraform).

## Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind v3 (no shadcn/ui) — own components in `src/components/`, HSL tokens, `cn()` helper
- **Routing**: react-router v6 · **Data**: React Query · **Icons**: lucide-react · **Motion**: framer-motion
- **Content**: **markdown in the repo** — `react-markdown` + `rehype-highlight` + `js-yaml` frontmatter,
  sanitized with `dompurify`. Loaded at build via `import.meta.glob`.
- **SEO/OG**: each route is **prerendered** at build (Playwright snapshot of `vite preview`), so meta/OG tags
  are in the served HTML.
- **PWA**: vite-plugin-pwa (offline-first, installable)
- **Fonts**: self-hosted `@fontsource` (Archivo + Inter)
- **Tests**: Vitest + React Testing Library (queries by role/text; no snapshots) · **E2E**: Playwright
- **Hosting**: AWS S3 + CloudFront (see `../../iac`)

## Architecture

**Fully static** — there is no backend. Content (CV, articles) is markdown in the repo, rendered client-side
and prerendered at build for SEO/OG. No API, auth, or database. Routes: the CV is the home (`/`); the portfolio
is `/portfolio`; the blog lives at `/blog` (`/articles*` kept for deep-link compat; `/profile` redirects to `/`).

## Visual identity (single theme, no dark/light toggle)

Borussia Dortmund palette: black/graphite + **gold `#E8A613`**. Tokens in `src/styles/index.css` (single
`:root`) and `tailwind.config.js`. Typography: **Archivo** for titles (`font-display`), **Inter** for body.
Architectural radius scale (no full pills except real circles/icon buttons), solid headers (no glassmorphism).

## Language

The whole site UI is **pt-BR** (features + UX/UI). No i18n framework — inline strings, `pt-BR` date locale. New
UI text is written in pt-BR.

## Conventions

- **snake_case** in content/data (markdown frontmatter, JSON); no mapping layer.
- Explicit UI states (loading/empty/error) via primitives in `src/components/Column.tsx`; forms via
  `src/components/Form.tsx`.
- "Blog" is the articles feature (canonical route `/blog`; `/articles*` kept for deep-link compat).

## Commands

```bash
npm run dev        # vite dev server (localhost:5173)
npm test           # vitest run --coverage — gate ≥85%
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # tsc + vite build (+ prerender for OG/SEO)
npm run gen-icons  # regenerate the PWA icons
```

## Workflow (trunk-based)

Branch from `main`; PR required (0 approvals). Merge to `main` → **automatic deploy** to the single environment
(the site serves at the apex `tadeumendonca.io`). CI runs lint + typecheck + test + build + the SonarCloud
quality gate. See the [repo README](../../README.md) for the full picture.
