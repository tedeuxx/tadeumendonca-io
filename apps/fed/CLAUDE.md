# tadeumendonca-fed

The public **static SPA** of **tadeumendonca.io** — interactive CV, portfolio catalog and blog.
No backend: content is markdown in the repo, prerendered at build time for OG/SEO. Part of the
`tadeumendonca` platform (sibling repos: `-skills` = Claude Code skills library; `-iac` = archived).

## Stack
- **React 18 + Vite + TypeScript**, **Tailwind v3** (preflight on).
- **No shadcn/ui** — own Tailwind components in `src/components/`, with shadcn-style HSL tokens
  (`src/styles/index.css` + `tailwind.config.js`). Class util: `cn()` in `src/lib/cn.ts`
  (clsx + tailwind-merge). No `cva`.
- React Query (kept for local/async state), react-router v6, lucide-react (icons),
  react-markdown + rehype-highlight (content).
- Tests: **Vitest + React Testing Library** (queries by role/text; no snapshot/visual tests).

## Architecture (fully static)
- **No backend, no auth, no XHR at runtime.** Everything the page needs ships in the bundle or in the
  prerendered HTML. Content (CV, articles) is markdown in the repo, read through `src/lib/content.ts`.
- `scripts/prerender.mjs` snapshots each route off `vite preview` so OG/SEO tags land in the served HTML.
- **No PWA** — no service worker, no manifest, no offline shell. `src/lib/serviceWorker.ts` only
  unregisters the retired worker for returning visitors; delete it once it can no longer be in the wild.

## Visual identity (non-obvious decisions — confirm before changing)
- **Single fixed theme, NO dark/light toggle.** No `ThemeProvider`. Palette: **modern brutalism** —
  near-black `#0A0A0A`, warm off-white `#F5F4EF`, and **one** accent, safety orange `#FF5A00`
  (`--primary: 21 100% 50%`). Tokens live in `src/styles/index.css` (single `:root`) + `tailwind.config.js`.
- Typography: **Space Grotesk** (display/sans) + **JetBrains Mono** (labels, data, meta). Self-hosted
  via `@fontsource`, imported in `src/main.tsx`.
- Shape: **radius 0, no shadow, no gradient** — enforced in the Tailwind scale itself, so a leftover
  `rounded-*` / `shadow-*` renders square and flat. Visible 12-col grid; rules (`--rule` / `--rule-strong`)
  are the layout's main device.
- Motion is decoration: CSS only (no framer-motion), every animation gated on `prefers-reduced-motion`.
- Reference: the approved hi-fi comp and the design-to-code plan in `docs/redesign/` (repo root).

## Language
- **The whole site UI is pt-BR** (features + UX copy). No i18n framework — inline strings, dates in the
  `pt-BR` locale. Write UI text in pt-BR. (Everything published on GitHub — this file, READMEs, commit
  and PR text — is written in English.)

## Conventions
- Explicit UI states (loading/empty/error) via the primitives in `src/components/Column.tsx`.
- "Blog" is the articles feature (canonical route `/blog/:slug`; `/articles*` kept for deep-link compat).
- Reader-first copy: the product is the reader learning something; self-promotion is a by-product.

## Commands
```bash
npm run dev        # vite dev server (localhost:5173)
npm test           # vitest run --coverage — coverage ≥85% (lines/funcs/branches/stmts) is a gate
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # tsc + vite build
npm run build:static  # build + prerender (the deploy artifact)
npm run e2e        # playwright
```

## Workflow (see platform)
- **Trunk-based**: branch from `main`; PR required (0 approvals). Merge to `main` → **automatic deploy**
  to the single environment (`https://tadeumendonca.io`).
- CI (`fed-ci`): lint + typecheck + test + build + **SonarCloud quality gate**. Numeric SemVer auto-bump.
