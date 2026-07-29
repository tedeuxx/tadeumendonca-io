# 0035. Curated repos render as static cards in long-form — a lone-URL facade + a leaf-bilingual field

- **Status:** accepted
- **Date:** 2026-07-25
- **Deciders:** the owner
- **Driven by:** [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), [ADR-0032](./0032-i18n-locale-layer-english-baseline.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0008](./0008-brutalist-mono-identity.md), [ADR-0012](./0012-snake-case-content-no-mapping.md)

## Context & problem
The ramp-up page's "sources" section lists Andrej Karpathy's teaching repos (nanoGPT, llm.c, nanochat, minGPT) as four inline markdown links crammed into one bullet — unscannable, and visually indistinguishable from the prose around them ([#122](https://github.com/tedeuxx/tadeumendonca-io/issues/122) item 3). They deserve the same scannable, on-brand card the portfolio catalog gives a project.

But a "repo card" pulls two decisions the site has not yet made in *long-form* content:
1. **Where do the card's facts come from?** GitHub's own OG-card image, or a live GitHub API call, would keep name/language/stars fresh — at the cost of a per-render request to a third party, which the site forbids ([ADR-0004](./0004-build-time-render-not-ssr-or-edge.md): content resolves at build, no runtime fetch; [ADR-0033](./0033-ga4-consent-gated-analytics.md): nothing third-party loads before consent).
2. **How does a card — a rich component — appear inside markdown-in-repo prose**, and where does its one-line *description* live given the bilingual rule (everything the reader reads is authored in both locales, [ADR-0032](./0032-i18n-locale-layer-english-baseline.md))?

## Decision drivers
- **No runtime third-party request** — a card must cost the reader zero network (ADR-0004, ADR-0033). A frozen fact is acceptable; a live fetch is not.
- **In-pattern over new mechanism** — the shared `Markdown` renderer already turns a lone YouTube URL into a `VideoEmbed` facade; the curated catalog is already a typed owner-authored list (`catalog.ts`). Prefer a second instance of each over a new abstraction ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)).
- **Facts once, prose per locale** — the ADR-0024 split: a repo's name/owner/language are the same in every edition (author once); only the description is prose (author per locale).
- **Brand fidelity** — the card obeys the fixed identity, it does not invent a new one ([ADR-0008](./0008-brutalist-mono-identity.md)).

## Considered options
1. **GitHub OG-card image per repo** (`opengraph.githubassets.com/…`) — one `<img>`, no JS. *Why not:* it is a **request to a GitHub CDN on every page load** — exactly the third-party fetch ADR-0004/0033 keep off the page — and the image bakes in a **star count that goes stale** and cannot be styled to the brutalist identity.
2. **Live GitHub API at build (or runtime)** to populate cards. *Why not:* runtime is out (ADR-0002/0004); build-time fetch adds a network dependency and a token to the build for data that barely changes, and still freezes stars at build. Not worth the moving part for four curated repos.
3. **Static, owner-curated card via the lone-URL facade (chosen)** — a small allowlist (`data/repoCards.ts`) of repos with **owner-authored** fields; the shared `Markdown` renderer turns a paragraph that is nothing but a registered repo URL into a `<RepoCard>` (the same opt-in shape as `VideoEmbed`), and any unregistered URL falls through to a plain link. *Trade-off:* the fields are **owner-maintained, not fetched** — a repo renamed or re-languaged on GitHub won't update until the owner edits the registry. Accepted: the set is tiny and curated, and this is the same build-frozen bargain the whole site already makes (ADR-0004).

## Decision outcome
Chosen: **option 3.** A repo becomes a card only when its canonical URL is in `data/repoCards.ts`; the match is case-insensitive and trailing-slash-tolerant so authored markdown can't silently miss. The card is **pure static text plus one outbound anchor** — no image, no iframe, no third-party request — and the whole card is a single `<a>` (one destination, so one anchor). It carries a **primary-language chip, deliberately not a star count**: a language is stable, a frozen star number misleads on a static card.

The card's **description is a leaf-level `{pt,en}` field** living in the registry — the first time a key-first bilingual leaf is composed *into* a per-locale long-form page (the page body stays one-file-per-locale per ADR-0032; the embedded card field is key-first per the same ADR's leaf rule). Facts (name, owner, language, url) are **authored once**, per ADR-0024's facts-once/prose-per-locale split.

**Boundary-by-path:** `data/repoCards.ts` carries reader-facing prose (the descriptions), so despite living under `src/data/` it is a **content boundary** — a description change is ratified by the owner via the `critical-reviewer`, not merged as safe app-data. This extends CLAUDE.md's content-by-path list (which enumerates `src/content/**`, `profile.ts`, `messages.ts`) to this file.

## Consequences
**Good**
- **Zero third-party cost.** The card ships as static text + an anchor; a ramp-up page with four cards still makes no external request (the property the OG-image option forfeits).
- **In-pattern, no new mechanism.** A second `VideoEmbed`-style facade and a second `catalog.ts`-style registry — nothing novel to learn or maintain.
- **No cross-surface / cross-locale drift.** Facts authored once can't disagree between editions; the description is bilingual, and parity is asserted (each edition renders without the other's text — ADR-0032).
- **Brand-consistent for free** — radius-0, no shadow/gradient, mono + accent (ADR-0008).

**Bad / accepted costs**
- **Owner-maintained facts.** Name/language/description are curated, not fetched — a GitHub-side rename needs a registry edit. Acceptable for a small curated set; revisit only if the list grows large enough that staleness bites.
- **A new content boundary to remember** — `data/repoCards.ts` is boundary-by-path though it sits under `src/data/`. Recorded here and in the file header so the classification isn't lost.

**Scope boundaries (deliberate)**
- **Only the four Karpathy repos** get cards in this slice. The other GitHub links in the same section (Matt Pocock, Garry Tan) stay plain links — a filed follow-on, not folded in (WIP=1).
- **Not a general provider registry.** One concrete `githubRepoUrl`-style match beside `youtubeId`, not a pluggable abstraction for a single provider (ADR-0001).
- **Prerender/OG unchanged.** The cards are in the served HTML (the anchors prerender in **both** locales — [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md);
  this cited ADR-0032's English baseline, retired 2026-07-26, #234); no new route, no sitemap change.

## Links
- Driven by ADR-0004 (build-time, no runtime fetch — rules out the OG-image/API options), ADR-0032 (leaf `{pt,en}` shape + parity), ADR-0024 (facts-once / prose-per-locale), ADR-0008 (identity the card obeys), ADR-0012 (typed data module).
- Second instance of the lone-URL facade first shipped for video (ADR-0004's `VideoEmbed`); second instance of the owner-curated typed list first shipped as `catalog.ts`.
- Coherent with ADR-0033 (no third-party request before consent — the static card makes none at all).
- Implements Issue #122 (item 3). Items 1–2 (Karpathy on X; embed-strategy rationale) shipped earlier.
