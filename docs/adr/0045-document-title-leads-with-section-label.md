# 0045. A document title is an address — it leads with the section's `nav.*` label, never with the page's heading

- **Status:** accepted (the owner decided the rule itself, in his own words on
  [#395](https://github.com/tedeuxx/tadeumendonca-io/issues/395), and asked for the record; `tech-lead`
  wrote it, in the implementing MR. The *copy* it produces is reader-facing and therefore the reviewer's
  to merge under [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment — with the
  one qualifier below, which is why the slice was still handled as boundary: the same strings are
  `og:title`, and a scraper pins what it fetches first ([ADR-0041](./0041-per-article-og-cards.md)).)
- **Date:** 2026-08-08
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#395](https://github.com/tedeuxx/tadeumendonca-io/issues/395) · constrained by
  [ADR-0041](./0041-per-article-og-cards.md) (an OG title is pinned on first fetch) and
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (every title exists twice, once per locale) ·
  touches the surfaces enumerated in [ADR-0010](./0010-routing-landing-cv-split-redirects.md)

## Context & problem
The owner clicked **Arquitetura** in the navigation, the tab opened, and the tab was called *"Como este
site é construído"*. The word he clicked appeared nowhere in it. With several tabs open, the page could
not be found by the name it was opened under — which is the entire job of a document title.

He then widened it himself, in three messages: follow the pattern `/portfolio` already had · apply it to
**all** areas of the site · and **it should be an ADR**. So the demand is not two strings.

**Nothing decided this anywhere.** Measured across every route before the change, the site had four
different shapes and no recorded reason for any of them:

| route | document title before | shape |
|---|---|---|
| `/portfolio` | `t('portfolio.heading')` → *Portfólio* | the section's own name — the reference the owner named |
| `/library` | `t('library.title')` → *Biblioteca* | the section's own name, from a dedicated key |
| `/ramp-up` | *Ramp-up para AI Engineer* | the section's name, qualified |
| `/me` | `` `${t('nav.profile')} — ${profile.name}` `` | the nav label, plus data |
| `/` | `'tadeumendonca.io'` | the site |
| `/architecture` | *Como este site é construído* | **names nothing the navigation says** |

The only comment on those keys explained that `useDocumentHead` appends the site name. It said what
happens to the string, never what the string is *for* — so each page's title was decided by whoever
wrote that page, and one of them decided differently.

**Two properties make this worth a record rather than a fix.**

First, **the title is not the heading, and collapsing them would be the wrong rule.** The H1 on
`/architecture` is *"Arquitetura — a planta, em aberto"*: it is the page's **argument**, deliberately
editorial, and it is copy doing a job. The title is an **address** — what a tab, a bookmark, a search
result and an unfurl carry — and its job is to be **findable**, not interesting. A convention that
pointed one at the other would retire one of the two.

Second, **the title is not one surface.** On the markdown-shell pages (`/architecture`, `/ramp-up`,
`/library`) a single `title` prop feeds four outputs —
[`MarkdownPage.tsx:19`](../../apps/fed/src/components/MarkdownPage.tsx) says so on the prop itself:
`document.title`, `og:title`, the `ShareButton` title and the JSON-LD `headline`. One of those four is
pinned by scrapers on first fetch and cannot be taken back (ADR-0041). Every clause below is shaped by
that asymmetry.

## Decision drivers
- **The tab must contain the word the reader clicked.** The reported defect, and the whole objective.
- **The rule must cover routes that do not exist yet**, since the failure — a section whose title stops
  naming it — is the kind nobody remembers to add a checklist row for.
- **The editorial H1 is not in scope and must stay out of it.** Explicitly ruled out on the Issue.
- **A title change is partly irreversible** (ADR-0041): the `og:title` half is pinned per URL. So the
  cheapest correct change beats the most thorough one.
- **Two locales, always** (ADR-0036) — a rule satisfied in one edition and not the other is not
  satisfied.
- **The catalog string is a PREFIX, not the title.** `useDocumentHead` appends `" · tadeumendonca.io"`
  unless it is already present, so any check that stops at the key is not checking what a tab shows.
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)) — a convention, not a
  title framework.

## Considered options

### What a document title must be
1. **It LEADS with the section's `nav.*` label; anything after it is optional and secondary** (chosen).
   The first words of the tab are the exact string the navigation presented, and a page may qualify
   itself after that. *Trade-off:* the rule is a **prefix test**, so it cannot object to a bad tail. A
   title that leads correctly and then rambles satisfies every gate here; the tail is a copy judgement
   with no mechanical guard, and that is deliberate rather than overlooked.
2. **It EQUALS the section's `nav.*` label** — the strictest reading of the pattern the owner named,
   and the strongest rejected option, because `/portfolio` — the example he pointed at — is an
   *equality* case: its tab is exactly *Portfólio*. *Why not:* on the three markdown-shell surfaces the
   title is also the `og:title`, the share title and the JSON-LD headline. A bare *Arquitetura* would
   unfurl **thinner than the card it replaces** — the reader in a timeline would be given a one-word
   label where they previously got a sentence — and it would additionally force a rewrite of
   `/ramp-up`, whose title is already correct under option 1, buying a pinned-card regeneration
   (ADR-0041) for no reader gain. **This is a copy call and it is the owner's to reverse**; it is
   recorded here as considered rather than unseen, and *"the rule is equality, drop the tails"* remains
   a one-line change to this record plus two strings.
3. **The title is the H1** — reject, and it is the seam this record exists to hold. It would delete
   *"Arquitetura — a planta, em aberto"* from the argument it is making, or bloat every tab with a
   subtitle that a SERP truncates away anyway. Address and argument are different objects with different
   jobs.
4. **Leave it as a per-page judgement and just fix `/architecture`** — reject. That is the state that
   produced the defect: five pages, four shapes, nothing recorded, and the next surface added would
   land on a fifth.

### Where the title's value comes from
1. **A dedicated `title` leaf in the section's own catalog group** (chosen). *Trade-off:* `portfolio`
   now has two keys holding the **same string**, which reads as duplication and will invite someone to
   collapse them again.
2. **Reuse the section's `heading` key** — *why not, and this is the clause that looks like a no-op and
   is not:* `PortfolioPage` was reading `portfolio.heading`, and the owner named that page as the
   pattern to follow. **The intent was followed and the mechanism was rejected.** The rendered string is
   identical today, which is exactly the danger: every other section's heading already carries a
   subtitle, so the day `portfolio.heading` grows one — an editorial change nobody would think of as
   touching SEO — the tab, the OG title, the share title and the headline all silently move with it. A
   title sourced from a heading is a title that drifts whenever the argument is edited. **Same string, a
   source that cannot drift.**
3. **Compose it in the page from `nav.*` plus data** — chosen **only** for `/me`, where the second half
   is the personal name from `src/data/profile.ts` rather than chrome, so there is no catalog string to
   hold it. *Cost:* `/me` is the one section with no `title` leaf, so the catalog-wide check cannot see
   it, and `ProfilePage.test.tsx` carries it instead. Recorded because an exception a derived test cannot
   reach is exactly the kind that rots quietly.

### How the rule is enforced
Chosen: **derived from the catalog, not listed.** `messages.test.ts` takes every top-level group that
owns a `title` leaf and asserts it leads with the matching `nav.*` label **in both locales**, so a
section added later is covered the moment it exists. It carries a guard against its own false green —
the derived set is asserted to be exactly `architecture, library, portfolio, rampup`, because renaming
the `title` convention would empty the list and make every assertion pass having compared nothing. That
guard is [ADR-0040](./0040-build-time-mermaid-diagrams.md)'s lesson applied at authoring time.
*Rejected — a hand-written table of route → expected title:* it has to be remembered, and this is the
failure class nobody remembers a row for.

**And asserted again on the served bytes**, in `e2e/seo.spec.ts`, over all twelve prerendered
route/locale pairs, with the lead words **spelled out rather than imported** — a test that reads the
expected string from the same catalog the page reads cannot fail when the catalog is wrong. It checks
the **composed** title (lead, plus the appended site name) and asserts `og:title` **equals** `<title>`,
because those two are one value with two blast radii: a route where they disagree means the head is
being assembled twice and the irreversible half is the one nobody looked at.

## Decision outcome
Chosen: **a document title leads with its section's `nav.*` label — the exact word the reader clicked —
and anything after it is optional and secondary. It is sourced from its own `title` leaf, never from a
heading. The visible H1 is a different object and stays editorial.**

`nav` is therefore the source of truth for the first words of five tabs, not just for the header bar.

**What changed, and what deliberately did not:**

- **`/architecture`** — now *"Arquitetura — como este site é construído"* / *"Architecture — how this
  site is built"*. The old title becomes the **tail** rather than being dropped, for the four-surface
  reason above.
- **`/portfolio`** — reads `portfolio.title` instead of `portfolio.heading`. Same rendered string; a
  different source.
- **`/ramp-up`, `/library`, `/me` — already compliant, and left alone rather than rewritten.**

**Four exceptions, each with its reason:**

1. **`/`** — it is the **site**, not a section, and has no nav entry to lead with. Its title is
   `tadeumendonca.io` bare, which is also why `useDocumentHead` does not append the site name to it (it
   appends only when the title does not already contain it).
2. **`/blog/:slug`** — an article is a **document**, not a section: its own name **is** the address a
   reader bookmarks, searches for and shares. Prefixing it with a section label would spend the front of
   the tab, and the front of a SERP line, on a word every article repeats. The not-found arm follows the
   same logic — *"Artigo não encontrado"* is the state, and it is what the reader needs first.
3. **`/me`** — composes from the nav label plus **data**, so it has no catalog `title` leaf (above).
4. **A conforming title is not rewritten to fit the new phrasing.** This is the most transferable of the
   four and it is stated as a **rule**, not as a note about three pages: **a title that already complies
   is not touched.** Rewriting one regenerates an `og:title` that scrapers have already pinned
   (ADR-0041) in exchange for nothing a reader can perceive. The convention's authority is over titles
   that **break** it, never over titles that satisfy it in a wording someone would have phrased
   differently.

**`/ramp-up` needs no change, and this record says so rather than leaving the silence.** The owner named
it alongside `/architecture` when he reported the defect, so the next reader would otherwise reasonably
assume it was missed. `nav.rampup` is *Ramp-up* in both editions and the title is *Ramp-up para AI
Engineer* / *Ramp-up to AI Engineer* — it leads with the label exactly, and qualifies after, which is
precisely what option 1 permits. **If the rule the owner meant was option 2 (equality), then `/ramp-up`
is not compliant and neither is the new `/architecture` title** — that is a copy decision for him, and
it is priced in option 2 above, not something to resolve inside the record.

## Consequences

**Good**
- The tab, the bookmark and the SERP line all name the section the reader clicked — the reported defect,
  closed on every route rather than on the one that was noticed.
- **A section added later is covered the day it exists**, because the check derives its subjects from the
  catalog. The convention does not depend on the next author having read this file.
- The address is **decoupled from the argument**: an editorial H1 rewrite can no longer move a tab, an
  OG title, a share title and a JSON-LD headline as a side effect.
- The seam is pinned on both sides — `ArchitecturePage.test.tsx` asserts the composed title leads with
  *Arquitetura* **and** that the H1 is still *"Arquitetura — a planta, em aberto"*, which is worth having
  precisely because the two now start with the same word and collapsing them looks harmless.
- `og:title` is asserted **equal** to `<title>` on the served bytes of every prerendered pair, so the
  irreversible half can no longer drift from the reversible one unnoticed.

**Bad / accepted costs**
- **The rule is a prefix test and cannot judge the tail.** Everything after the label is unguarded copy.
  A title can lead correctly and still read badly, and no gate here will say so.
- **`portfolio.title` and `portfolio.heading` hold the same string with nothing keeping them equal** —
  nor should there be, since the whole point is that they may diverge. The duplication is intentional
  and will look like an oversight to a reader who has not opened this record; the catalog comment on
  the key is the only thing pointing back here.
- **`/me` sits outside the derived check** and is covered by one page test. Its exception is the kind
  that rots quietly, because the catalog-wide assertion will stay green while saying nothing about it.
- **The one-word section names are now load-bearing for SEO.** `nav.*` was header chrome; changing a nav
  label now moves five document titles and three OG titles, one of which is pinned per URL. That is a
  new coupling this record creates, and it is the price of having a single source for the address.
- **Three surfaces inherit a four-way constraint.** Any future title change on `/architecture`,
  `/ramp-up` or `/library` is simultaneously a tab change, an unfurl change, a share-sheet change and a
  structured-data change. It cannot be evaluated as "just the tab" again.
- **The E2E spells its expected strings out**, so a *deliberate* future title change turns it red and
  must be updated in the same commit. That is the guard working, and it is still a maintenance cost.

**Neutral**
- **No H1 is touched, and `iac/` is untouched.** Static strings in the bundle, served by the existing
  behaviour ([ADR-0013](./0013-s3-cloudfront-hosting.md)) — and stated with the caution ADR-0041 earned
  the hard way: what is asserted is that no cache behaviour, origin or Terraform resource is involved,
  not merely that the output is static.
- Nothing here decides anything about **meta descriptions**, kickers or nav labels themselves. They are
  the same family of question — consistency across areas — and they are separate decisions.

## Links
- **Implements** Issue [#395](https://github.com/tedeuxx/tadeumendonca-io/issues/395).
- **Constrained by [ADR-0041](./0041-per-article-og-cards.md)** — the `og:title` is pinned by the first
  scraper to fetch a URL. That single property is why a conforming title is left alone, why the old
  `/architecture` title survives as a tail, and why option 2 above was not taken for free.
- **Constrained by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)** — every title exists twice,
  and the rule is asserted per locale in both the unit and the E2E layer.
- **Applies to the surfaces of [ADR-0010](./0010-routing-landing-cv-split-redirects.md)** — the six public
  routes it has accumulated by amendment. A seventh inherits this convention automatically.
- **Consistent with [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)** — `/me`'s title composes
  from `profile.ts` rather than re-typing the name, the same "printed from the canonical source" rule.
- **Does not touch [ADR-0008](./0008-brutalist-mono-identity.md)** — the H1 is identity copy and is out of
  scope by design.
- Implementation: `apps/fed/src/i18n/messages.ts` (the `title` leaves and the convention comment),
  `apps/fed/src/i18n/messages.test.ts` (the derived catalog-wide rule),
  `apps/fed/e2e/seo.spec.ts` (the composed title and `og:title` on the served bytes),
  `apps/fed/src/pages/PortfolioPage.tsx`, `apps/fed/src/pages/ProfilePage.tsx`,
  `apps/fed/src/pages/LibraryPage.tsx`, `apps/fed/src/pages/LandingPage.tsx`,
  `apps/fed/src/pages/ArticlePage.tsx` (the two in-diff exceptions),
  `apps/fed/src/pages/ArchitecturePage.test.tsx`.
