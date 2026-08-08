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

**Reader-facing by path:** `data/repoCards.ts` carries reader-facing prose (the descriptions), so despite living under `src/data/` a change to one is copy, not app data. ~~It is therefore a content boundary ratified by the owner, extending CLAUDE.md's content-by-path list.~~ **Retired by ADR-0003's 2026-07-30 amendment**, which made reader-facing content safe class and deleted that list. What survives is the *dispatch* consequence: a description change still goes through `brand-guardian`, which is now the only lens on it rather than the first of two. *(That lens has been renamed twice since — `brand-guardian` → `marketing-lead` at skills ADR-0002 amendment #7, `marketing-lead` → **`product-lead`** at `-skills`#144. The routing is unchanged; only the name a dispatcher types is. The record is not rewritten — see ADR-0043's 2026-08-04 amendment.)*

## Consequences
**Good**
- **Zero third-party cost.** The card ships as static text + an anchor; a ramp-up page with four cards still makes no external request (the property the OG-image option forfeits).
- **In-pattern, no new mechanism.** A second `VideoEmbed`-style facade and a second `catalog.ts`-style registry — nothing novel to learn or maintain.
- **No cross-surface / cross-locale drift.** Facts authored once can't disagree between editions; the description is bilingual, and parity is asserted (each edition renders without the other's text — ADR-0032).
- **Brand-consistent for free** — radius-0, no shadow/gradient, mono + accent (ADR-0008).

**Bad / accepted costs**
- **Owner-maintained facts.** Name/language/description are curated, not fetched — a GitHub-side rename needs a registry edit. Acceptable for a small curated set; revisit only if the list grows large enough that staleness bites.
- **A file whose data is copy** — `data/repoCards.ts` reads as app data and is not. Recorded here and in the file header so the classification isn't lost. It is no longer an owner gate (ADR-0003, 2026-07-30), but it is still the trigger for `brand-guardian` — the lens now held by `product-lead`, per the pointer above.

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

## Amendment, 2026-08-08 — the trigger now arrives as a GFM-autolinked element; the decision is unchanged, its mechanism is not what this record says

**What moved.** PR #404 adds `remark-gfm` to the shared `Markdown` renderer so the two pipe tables on `/architecture` render as tables. Enabling GFM also enables **autolink literals**, and that reaches this record: a bare URL on its own line is no longer plain text in the AST, it is an `<a>`.

**Why that touches ADR-0035 rather than passing under it.** This record describes the chosen option as *"the shared `Markdown` renderer turns a paragraph that is nothing but a registered repo URL into a `<RepoCard>`"*, and the outcome as a match that is *"case-insensitive and trailing-slash-tolerant so authored markdown can't silently miss."* Both sentences are still true of the **authoring contract** — an author writes a bare URL on its own line, exactly as before, and this amendment changes nothing a content author does. They are no longer accurate about the **mechanism**. `loneUrl()` in `src/components/Markdown.tsx` has two branches:

- the **string** branch (`typeof only === 'string'`), which every lone URL used to hit;
- the **element** branch, which accepts a lone `<a>` whose rendered label equals its `href`.

Under GFM, an autolink's label *is* its href, so every lone URL now satisfies the element branch and takes it. **The string branch is retained as a fallback, deliberately and not as dead code:** `<https://example>` (an explicit CommonMark autolink) still arrives as a bare string, and so would any future change to the plugin set. A facade that silently stopped rendering would read as a content bug rather than a renderer one, which is the failure this branch exists to prevent.

**Measured, not inferred.** 22 lone bare URLs exist in the whole content tree — 11 in `rampup.en.md` and 11 in `rampup.pt.md`, none anywhere else (`grep -rn '^https\?://' src/content/`). Those 22 are the population that changed branch: 4 video facades and 7 repo cards per locale. #404 verified the rendered result against the prerendered `dist/` for both locales, and `Markdown.test.tsx` asserts the autolinked-element path builds a facade rather than assuming the label-equals-href property.

**The second, wider consequence, recorded here because it is currently written down nowhere outside a code comment.** GFM is enabled on the **shared** renderer, so it is live on `MarkdownPage` and `ArticlePage` alike — `/architecture`, `/ramp-up` and every article, not only the page whose tables prompted the change. That is a change to the **authoring surface for all future content**: tables, strikethrough, task lists, autolink literals and bare-email autolinking are now available to, and applied to, every published page. #404 swept the existing corpus for what that newly triggers — no bare URL mid-prose, no bare email, no scheme-less `www.` literal — and found nothing the content did not already intend. The sweep covers the corpus as it stood; it is not a standing guarantee for content written after it.

**Why this is an amendment and not a new record**, applying this library's own significance test to itself. Nothing here decides anything. Option 3 stands, the rejected options (GitHub OG-card image, live GitHub API) are still rejected for the reasons given, and no alternative was weighed. What changed is a factual description inside an accepted decision, and a record that misdescribes its own mechanism is precisely what the amendment move exists for — it appends without overwriting the reasoning. A separate ADR for `remark-gfm` was considered and **rejected**: it is the canonical companion plugin to an already-decided dependency (`react-markdown`), source-level with no HTML passthrough, no build toolchain, no runtime surface and no third-party request — measured against [ADR-0040](./0040-build-time-mermaid-diagrams.md), which earned its own record on exactly the properties this one lacks. An ADR for a routine change is worse than none, because it trains readers to skim.

**Consequence for this document's own index row.** Adding this section flips `amended` to `true` for record 0035 (`scripts/adr-source.mjs`'s `hasAmendment` matches an `## Amendment` heading), so `src/content/generated/adrs.json` must be regenerated in the same MR — `diffAgainstArtifact` compares `amended` field-by-field and fails otherwise — and the published row on `/architecture` gains its amended marker.

- Amends the *mechanism* described in **Decision drivers** and **Considered options** option 3. The decision outcome is untouched.
- Applies equally to the **video** facade, which shares `loneUrl()` and has no record of its own beyond the mention in [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md).
