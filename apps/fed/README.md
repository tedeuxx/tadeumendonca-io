# apps/fed

Public SPA for [tadeumendonca.io](https://tadeumendonca.io) — feed, blog, profile/CV and the admin compose
screens. An installable, **offline-first PWA**. Part of the [`tadeumendonca-pwa`](../../README.md) monorepo
(sibling: `apps/bff`, the BFF).

## Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind v3 (no shadcn/ui) — own components in `src/components/`, HSL tokens, `cn()` helper
- **State**: React Query (server state) + Zustand (`src/auth/authStore.ts`)
- **Routing**: react-router v6 · **Icons**: lucide-react
- **Auth**: AWS Cognito hosted-UI PKCE (via aws-amplify)
- **PWA**: vite-plugin-pwa + IndexedDB-persisted React Query outbox (offline reactions/comments)
- **Tests**: Vitest + React Testing Library (queries by role/text; no snapshots)
- **Hosting**: AWS S3 + CloudFront

## Architecture

The SPA talks **only** to the BFF ([`apps/bff`](../bff)) via API Gateway; external auth is Cognito. The SDK
stores the JWT and sends it as a Bearer token; the API Gateway authorizer validates it. **No server-side auth
logic lives here** — UI gating is cosmetic. Build config (`VITE_*`) comes from SSM at deploy time. The feed is
the home (`/`); the CV is an internal page (`/profile`); the blog lives at `/blog`.

## Visual identity (single theme, no dark/light toggle)

Borussia Dortmund palette: black/graphite + **gold `#E8A613`**. Tokens in `src/styles/index.css` (single
`:root`) and `tailwind.config.js`. Typography: **Archivo** for titles (`font-display`), **Inter** for body.
Architectural radius scale (no full pills except real circles/icon buttons), solid headers (no glassmorphism).

## Language

The whole portal is **pt-BR** (features + UX/UI). No i18n framework — inline strings, `pt-BR` date locale. New
UI text is written in pt-BR.

## Conventions

- **snake_case** in data/JSON (mirrors the BFF; no mapping layer).
- Explicit UI states (loading/empty/error) via primitives in `src/components/Column.tsx`; forms via
  `src/components/Form.tsx`.
- "Blog" is the articles feature (canonical route `/blog`; `/articles*` kept for deep-link compat).

## Commands

```bash
npm run dev        # vite dev server (localhost:5173)
npm test           # vitest run --coverage — gate ≥85%
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # tsc + vite build
npm run gen-icons  # regenerate the PWA icons
```

## Workflow

GitFlow: branch from `develop`; PR required (0 approvals). Merge to `develop` → **automatic staging deploy**
(`https://staging.tadeumendonca.io`). `main` → production (with approval). CI runs lint + typecheck + test +
SonarCloud quality gate. See the [monorepo README](../../README.md) for the full picture.
