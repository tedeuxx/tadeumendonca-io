# 0037. Article slugs are localized — a locale-matched slug per edition

- **Status:** accepted
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Supersedes / superseded by:** — (supersedes, for the **blog surface only**, [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s "one English slug, prefixed per locale — NOT dual localized slugs" clause; resolves the dual-slug question [ADR-0010](./0010-routing-landing-cv-split-redirects.md) deferred on 2026-07-25)
- **Driven by:** Issue [#182](https://github.com/tedeuxx/tadeumendonca-io/issues/182); consistent-with [ADR-0002](./0002-fully-static-spa-no-backend.md), [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0032](./0032-i18n-locale-layer-english-baseline.md), [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)

## Context & problem
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) made language an address (symmetric `/pt` · `/en`
prefixes, per-locale prerender, hreflang), but kept the **slug itself a shared fact** — one slug per article,
authored once and prefixed per locale. For the launch article that slug is Portuguese (`meu-compromisso`), so
the English edition resolves to `/en/blog/meu-compromisso` — an **English route carrying a Portuguese slug**.
ADR-0036 explicitly drew this boundary ("NOT dual localized slugs… a bigger routing decision ADR-0010
flagged; not decided here"), and ADR-0010 left "localized URL prefixes… a separate, unmade decision."

The professional-presence strategy now needs it made: the owner **posts in English on LinkedIn** and must link
a **clean English-slug URL** (`/en/blog/my-commitment`). A Portuguese slug on an English post is an
inconsistency the strategy's Swiss-watch-consistency principle rejects — and a one-off redirect workaround
would itself break that principle. The slug must be **in the language of the route**.

## Decision drivers
- **Locale-matched URLs** — the slug is in the language of its edition (`/en/blog/my-commitment`,
  `/pt/blog/meu-compromisso`); first-class pt-BR discovery on the slug itself, and a coherent English URL for
  the English LinkedIn publication standard (Issue #178).
- **Consistency over workaround** — no per-URL redirect hacks; do the real routing change.
- **Static invariant, no edge** ([ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)) — resolution stays
  build-time + client-side; the CloudFront Function remains the locale-agnostic clean-URL rewrite. `iac/` untouched.
- **English stays canonical** ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md)) — x-default points at
  the **English** slug; article identity is keyed on the canonical English slug.
- **Blog surface only** — non-article routes (`/me`, `/portfolio`, `/architecture`, `/ramp-up`) keep one shared
  slug prefixed per locale (ADR-0036 as-is); this decision is scoped to `src/content/blog/**`.

## Considered options
1. **Per-locale `slug`; article identity = the filename base, never a URL** (chosen) — each edition authors its
   own `slug` in frontmatter (the `en` edition defaults from the filename key, `pt` overrides); the article's
   stable identity is the filename base (the canonical English slug), used only as the grouping key. *Trade-off:*
   two permanent public-URL contracts per article instead of one, and a slug↔slug mapping is now required in
   **three** places (the PT/EN toggle, hreflang alternates, prerender/sitemap enumeration) — the blog routes
   lose ADR-0036's "one logical route prefixed twice" symmetry.
2. **Keep one shared slug + a per-URL redirect** — leave the single (Portuguese) slug and add a redirect so
   `/en/blog/meu-compromisso` serves a clean English URL. *Why not:* the redirect is exactly the workaround the
   Swiss-watch-consistency principle rejects — a per-article special case in the routing table — and the
   article's identity on an English route stays a Portuguese slug. Do the real routing change once, not a
   redirect per article per rename.
3. **Keep the shared English slug for both editions (ADR-0036 as-is), no localized slug** — publish the article
   under one English slug prefixed per locale (`/pt/blog/my-commitment` · `/en/blog/my-commitment`). *Why not:*
   it just mirrors the inconsistency onto the pt-BR edition (a pt-BR route carrying an English slug) and
   forfeits first-class pt-BR discovery on the slug itself — the discovery imbalance the i18n slices exist to
   close.

## Decision outcome
Chosen: **option 1 — article `slug` becomes per-locale.**

- **Identity ≠ address.** An article's stable identity is its **filename base** (grouping key for
  `buildEditions`), by convention the **canonical English slug**; it never appears in a URL. Each edition
  carries its own `slug` in frontmatter (the `en` edition defaults from the key; `pt` overrides). `slug` leaves
  the shared-`FACT_KEYS` set (date/tag/track stay shared); the unpublishable contract (both editions required)
  is unchanged.
- **Runtime** `getPostBySlug(slug, locale)` matches on that locale's own edition slug — no ambiguity.
- **The toggle maps the slug.** `setLocale` resolves an article route to the sibling edition's slug
  (`localizeArticlePath`), so `/en/blog/my-commitment` ⇄ `/pt/blog/meu-compromisso` (not a not-found).
- **hreflang / sitemap / prerender** emit the per-locale slugs reciprocally; x-default = the English slug.
- **Migration:** the launched article → `my-commitment.{en,pt}.md` (EN slug `my-commitment`, PT slug
  `meu-compromisso` unchanged). **No redirect** for the retired `/en/blog/meu-compromisso` — pre-launch, the
  LinkedIn post is not yet published, there are no external inbound links, and the SPA already soft-handles an
  unknown slug as an in-app not-found. (A one-slug redirect map would be the workaround the consistency rule rejects.)
  *(The "pre-launch, not yet published" premise expired on 2026-07-26 — the site launched and ADR-0038 makes
  LinkedIn + X distribution standing. The DECISION stands unchanged: the URL never circulated, so there is
  nothing to redirect. Recorded rather than rewritten, because the same reasoning applied to a slug that HAS
  circulated would give the opposite answer. #234.)*

## Consequences
- **+** A clean, in-language, shareable URL per edition; the English LinkedIn strategy links `/en/blog/<en-slug>`;
  pt-BR discovery is first-class on the slug, not just the prefix.
- **+** Identity/address separation is explicit and documented, so future articles just add per-locale slugs.
- **−** A slug↔slug mapping is now required in **three** places (the PT/EN toggle, hreflang alternates,
  prerender/sitemap enumeration) — the build-time enumeration loses ADR-0036's "one logical route prefixed
  twice" symmetry for blog routes.
- **−** Two permanent public-URL contracts per article instead of one — more surface to keep stable.
- **Neutral** — code-only; `iac/` and the CloudFront Function are untouched (no Accept-Language edge logic).

Non-article routes are unaffected. If a future article needs its old slug preserved after a rename (post-launch,
with external links), that will need a redirect mechanism decided then — explicitly out of scope here.

## Links
- **Implements** Issue [#182](https://github.com/tedeuxx/tadeumendonca-io/issues/182).
- **Revises, for the blog surface only, [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)** — its
  "one English slug, prefixed per locale — **NOT** dual localized slugs" clause no longer holds for
  `/blog/:slug`; ADR-0036 otherwise stands in full (symmetric per-locale prefixes, per-locale prerender,
  hreflang + OG-per-locale). Non-article routes keep the one-slug-prefixed-twice scheme.
- **Resolves the dual-slug question deferred in [ADR-0010](./0010-routing-landing-cv-split-redirects.md)** —
  its 2026-07-25 `/architecture` amendment set aside a dual localized-slug pair as "a bigger routing decision…
  not adopted by default." That decision is made here, scoped to the blog surface.
- **Consistent with [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — resolution stays build-time +
  client-side; no SSR/edge, no Accept-Language logic; `iac/` and the CloudFront Function untouched.
- **Consistent with [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) / [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)** —
  English stays canonical; the filename key and x-default are the canonical English slug.
