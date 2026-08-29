# tadeumendonca-fed

The public **static SPA** of **tadeumendonca.io** — interactive CV, portfolio catalog and blog.
No backend: content is in the repo — markdown for long-form, typed TypeScript for structured data —
prerendered at build time, in both locales, for OG/SEO. The Terraform that serves it lives alongside,
in `iac/`.

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
  prerendered HTML. Content is in the repo in **two shapes**: **markdown** for long-form (articles,
  ramp-up, architecture — read through `src/lib/content.ts`) and **typed TypeScript** for structured data
  (`src/data/profile.ts` is the CV, `catalog.ts` the portfolio, `repoCards.ts` the embedded cards).
- `scripts/prerender.mjs` snapshots each route **in both locales** off `vite preview`, so OG/SEO tags land
  in the served HTML, and prints `/cv.pdf` from `/en/me` in the same pass. **The prerender is not a
  visitor** (ADR-0036 amendment): it runs one en-US browser and its HTML is served to everyone, so
  anything rendering off the visitor rather than the route must opt out via `window.__PRERENDER__` — a
  post-mount flag does not do it, because the snapshot comes from an already-hydrated page.
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
  a UI string.** Dates use the active locale. **Both locales are prerendered** — ADR-0036 **retired**
  0032's English-pinned crawlable baseline: every route is snapshotted in each locale with its own head,
  and the en-US browser context in `scripts/prerender.mjs` is the *browser*, not a content baseline. The
  one bare-root snapshot is still English, as the x-default entry for the JS-less crawler.
  **The CV content localizes too**: `src/data/profile.ts` is authored bilingually (`ProfileSource`, same
  key-first shape as the message catalog) and flattened per locale by `resolveProfile`, so chrome and
  content are always in the same language. **English stays the canonical edition** (ADR-0024) — it is what
  LinkedIn carries, what `/cv.pdf` is printed from, and what `profile` (the resolved constant) exports;
  pt-BR is a translation of it, and facts (dates, employers, official job titles, certification names) are
  authored **once** and shared, so the two editions cannot disagree.
- **EVERYTHING the reader reads is authored in both languages** — chrome, CV, catalog copy, and
  **long-form prose**. There is no category where chrome and body may disagree (owner rule, 2026-07-23;
  supersedes ADR-0032's long-form deferral). **In every reader-facing module a missing translation is a
  COMPILE error, not a runtime surprise** — `profile.ts` via `ProfileSource`, `src/i18n/messages.ts` via
  its `satisfies`, `data/repoCards.ts` and `data/catalog.ts` via a leaf `Record<Locale, string>`, and the
  blog loader by throwing at module load. `catalog.ts` was the one module typed as a plain string, and it
  shipped Portuguese to `/en/portfolio` for three days because nothing objected (#235). **Long-form uses
  one markdown file per locale** — `<name>.pt.md` / `<name>.en.md`,
  selected through a `Record<Locale, string>` so a missing translation is a **compile error**
  (`src/content/rampup.*.md` is the reference implementation). This is deliberately NOT the key-first
  `{ pt, en }` shape used for the catalog and the CV: a paragraph is not a leaf, and interleaving two
  languages in one document makes both unreadable to edit. Same contract, different granularity.
  *Two files can drift where an object cannot*, so parity is asserted — both editions must expose the
  same links and embedded videos in the same order, and each must render without the other's text.
  **The blog is bilingual too** (#83): `lib/content.ts` loads the per-locale `<key>.pt.md` / `<key>.en.md`
  pair and **throws at module load if either is missing** — the single-language case fails the build, the
  prerender and the tests, so it cannot ship. The **filename base is the article's stable KEY** (the
  grouping identity, by convention the canonical English slug) — it is never a URL. **`slug` is per-locale
  frontmatter** (#182, ADR-0037), so the two editions carry different URLs — EN `/en/blog/my-commitment`,
  PT `/pt/blog/meu-compromisso` — while the remaining facts (date, tag, track, links, media) are still
  authored once and shared. `getPostBySlug` matches on the active locale's own slug, and the toggle maps
  `/blog/<thisSlug>` → `/blog/<otherSlug>` across locales (`localizeArticlePath`); hreflang advertises the
  reciprocal localized pair, **x-default → the PREFIXED English URL** (`/en/blog/<en-slug>`, #200 —
  never the bare `/blog/<slug>`, which the prerender does not snapshot, so a scraper there reads the
  HOME page's OG card). The rule is general: **advertise only what the build prerenders** (ADR-0036
  amendment). **Resolving ≠ advertising:** the bare form *does* now reach the article in both editions
  (#204 — the unprefixed redirect maps the slug via `articlePathForLocale`, since re-prefixing it
  verbatim dead-ended a pt-BR reader), but it is still un-prerendered and must **not** be re-added to
  hreflang or the sitemap.
  **An article can be HELD** (#510, ADR-0049): `draft: true` in frontmatter — a **shared fact**, so both
  editions must agree — takes it out of **four** public enumerations and no more. `lib/content.ts` drops
  it from `byLocale` (the index, the feed, the track filters) while `getPostBySlug`/`getEditions` still
  resolve it; `scripts/routes.mjs` drops it from `localizedRoutes()`, so it leaves the sitemap **and** the
  prerender together (the never-drift invariant holds — both sets shrink); `scripts/og-cards.mjs` requires
  no card for it; `scripts/gen-distribution.mjs` writes no draft kit for it. The URL still answers, because
  `custom_error_response` maps 404 → `/index.html` with a 200 and the SPA routes client-side. **`?preview`
  is what distinguishes reading it from not finding it** (`lib/preview.ts`): without it, `ArticleRoute`
  redirects to the locale home; with it, the article renders in the real chrome and declares
  `robots: noindex, nofollow`. Promotion is one edit — `draft: false` plus the real date — and rebuilds
  nothing else. **An explicit flag, never a future `date`**: a wall-clock comparison would make the same
  commit build differently tomorrow, breaking *rebuild the tag to reproduce production*.
  **It buys isolation, not privacy, and the difference is not cosmetic:** while a held draft is deployed
  its full body — both editions — ships inside `dist/assets/index-*.js` and is fetchable by anyone with no
  parameter at all. Nobody stumbles into it; anybody who knows to look will find it. ADR-0049 records that
  consequence with the command that measures it, and the upgrade path to a genuinely private draft.
  **So what may be held follows from what the hold does:** hold a piece that is merely UNFINISHED, and
  never one whose *existence* is the sensitive part — a draft that names something confidential is fully
  readable in the bundle from the moment it deploys, and the hold protects it not at all. Being out of
  the index buys time to write, not secrecy; if it must not be readable, it must not be committed.
  **Reviewing a held draft is two controls, and they are gated by the PARAMETER and not by the flag**
  (#506): behind `?preview` an article renders a review bar with **a link to its `content` Issue** and
  **a button that copies the whole article to the clipboard**. The Issue is named in frontmatter —
  `contentIssue: <number>`, a **shared fact**, so both editions must agree; **omit it and no link is
  rendered** (a button opening the wrong Issue is worse than none), while a value that is present and not
  a positive integer **fails the build** rather than degrading silently. Copy and never a prefilled
  `?body=` URL: browsers and servers cut around 8 KB and the articles run 6–12 KB, so a URL would work on
  the short pieces and truncate the long ones invisibly. **The gate is the parameter alone**, which means
  a PUBLISHED article reached with `?preview` renders the bar too — that is what makes promotion rebuild
  nothing, and it is why none of these four strings is ever seen by a reader who did not type the
  parameter.
  The committed fixture pair (`src/content/blog/held-draft-fixture.{pt,en}.md`, identified once in
  `src/content/heldFixture.ts`) is what every gate asserts against — **do not publish it**; flipping its
  flag is the mutation that proves those gates can go red.
  (Everything published on GitHub — this file, READMEs, commit and PR text — is written in English.)

## Conventions
- Explicit UI states (loading/empty/error) via the primitives in `src/components/Column.tsx`.
- "Blog" is the articles feature. The only article route is `/blog/:slug`, per-locale (ADR-0037);
  `/blog` itself redirects to the landing's `#artigos`. There is no `/articles` compat route — it was
  dropped pre-launch (#234) and `e2e/seo.spec.ts` asserts the site never advertises one.
- Reader-first copy: the product is the reader learning something; self-promotion is a by-product.

## Commands
```bash
npm run dev        # vite dev server (localhost:5173)
npm test           # vitest run --coverage — coverage ≥85% (lines/funcs/branches/stmts) is a gate.
                   # It is a GLOBAL AVERAGE, not a per-file floor: a file below 85 passes if the whole
                   # clears it (ADR-0018's 2026-07-29 amendment, #228). Read the per-file table when
                   # adding tooling — the green does not say what it looks like it says.
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # tsc + vite build
npm run build:static  # build + prerender (the deploy artifact)
npm run e2e:local        # build:static (build + PRERENDER), THEN Playwright against a preview.
                         # This is the local gate and it now matches CI exactly (#189). It used to run
                         # plain `build`, so 9 specs that assert the prerendered artifact — /cv.pdf, the
                         # per-locale HTML, hreflang, x-default — failed by construction on a healthy
                         # branch. A gate that is only correct if you read the docs is not a gate.
npm run e2e:local:built  # skips the build; use right after one (CI does) — `vite build` empties dist/
npm run e2e              # bare: now FAILS FAST with guidance if no target is set — no silent default (#88).
                         #   the deploy job sets E2E_ENV for its post-deploy smoke; locally use e2e:local.
npm run e2e:production   # ⚠️ drives the LIVE apex on purpose (E2E_ENV=production)
```
**One spec is post-deploy-only and SKIPS locally** — `e2e/edge-rewrite.spec.ts` (#216). It requests the
advertised **slash-less** URLs and compares the served canonical to the requested one, which is the only
thing that catches the CloudFront rewrite function being **detached, stale, or rejected by the JS 2.0
runtime** (the unit test at `scripts/spa-rewrite.test.mjs` proves the logic, never that the edge runs it).
`vite preview` does not rewrite, so locally it would fail for a harness reason rather than a site reason —
which #195's rule for the post-deploy step forbids. It reports **skipped**, not passed, anywhere it cannot
run: a check that did not run must not read like one that did.

**It runs in `infra-apply`, not in `deploy`** (#237). `infra-apply` is the workflow that changes the
function; `deploy` never fires on the change this guards — it triggers on the version bump and its `gate`
job filters the release range to `apps/fed`, `packages/shared` and its own workflow file (#299), so an
`iac/` change reaches it in neither form — and moving
the trigger there instead would have raced the apply and asserted against the *previous* function. `deploy`
still runs it as part of the full smoke, which is legitimate redundancy on an `apps/fed`-only merge.

## Workflow (see platform)
- **Trunk-based**: branch from `main`; PR required (0 approvals). Merge to `main` → **automatic deploy**
  to the single environment (`https://tadeumendonca.io`).
- CI (`build-test`): lint + typecheck + test + build + E2E + **SonarCloud quality gate**. Numeric SemVer auto-bump.
