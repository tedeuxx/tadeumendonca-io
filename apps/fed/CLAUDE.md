# tadeumendonca-fed

The public **static SPA** of **tadeumendonca.io** — interactive CV, portfolio catalog and blog.
No backend: content is markdown in the repo, prerendered at build time for OG/SEO. The Terraform that
serves it lives alongside, in `iac/`.

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
  `rounded-*` / `shadow-*` renders square and flat. **One carved exception:** the portrait is round,
  via the hand-written `.avatar-round` utility in `src/styles/index.css` — deliberately NOT reachable
  through Tailwind, so the guard above stays intact (ADR-0008 amendment). A face is a portrait, not a
  UI box; every actual surface (cards, buttons, inputs, rules) is still radius 0. Visible 12-col grid; rules (`--rule` / `--rule-strong`)
  are the layout's main device.
- Motion is decoration: CSS only (no framer-motion), every animation gated on `prefers-reduced-motion`.
- Reference: the approved hi-fi comp and the design-to-code plan in `docs/redesign/` (repo root).

## Language
- **The site UI is bilingual (pt-BR + en)** via a **light in-repo locale layer** (`src/i18n/`: a typed
  pt/en catalog, `LocaleProvider`, `useT()`/`useLocale()`; **ADR-0032**, supersedes ADR-0011). It
  **auto-detects the visitor's native language** and offers a **PT/EN toggle** (persisted, overrides
  detection). **Add every new UI-chrome string to the `src/i18n/` catalog in both locales — never hardcode
  a UI string.** Dates use the active locale. The **crawlable/OG prerender baseline is pinned to English**
  (`scripts/prerender.mjs` forces the snapshot locale to en-US). **The CV content localizes too**:
  `src/data/profile.ts` is authored bilingually (`ProfileSource`, same key-first shape as the message
  catalog) and flattened per locale by `resolveProfile`, so chrome and content are always in the same
  language. **English stays the canonical edition** (ADR-0024) — it is what LinkedIn carries, what the
  prerender serves, and what `profile` (the resolved constant) exports; pt-BR is a translation of it, and
  facts (dates, employers, official job titles, certification names) are authored **once** and shared, so
  the two editions cannot disagree. Deferred: route-prefixed `/en`·`/pt` + per-locale prerender/hreflang.
  (Everything published on GitHub — this file, READMEs, commit and PR text — is written in English.)

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
- CI (`build-test`): lint + typecheck + test + build + E2E + **SonarCloud quality gate**. Numeric SemVer auto-bump.
