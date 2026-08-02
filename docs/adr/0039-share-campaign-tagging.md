# 0039. Reader shares are campaign-tagged — three immutable UTM parameters, no `utm_content`

- **Status:** accepted · **amended 2026-08-01** (`share-sheet` loses its only emitter when #314 unifies the two share affordances; the value stays defined, and the 90-day success-criterion window is affected two days in)
- **Date:** 2026-07-30
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#272](https://github.com/tedeuxx/tadeumendonca-io/issues/272) (the observability
  [#267](https://github.com/tedeuxx/tadeumendonca-io/issues/267) deliberately shipped without) ·
  constrained-by [ADR-0033](./0033-ga4-consent-gated-analytics.md) (the consent gate) · refines
  [ADR-0023](./0023-observability-static-site.md) · reserves a value for
  [ADR-0038](./0038-content-distribution-linkedin-and-x.md)

## Context & problem
[#267](https://github.com/tedeuxx/tadeumendonca-io/issues/267) shipped the article share affordances —
WhatsApp, X, LinkedIn deeplinks and the OS share sheet — with **nothing observable**, deliberately, tracked
as this Issue. `grep -ri utm` over `apps/fed` and `docs` returned zero hits: there was no tagging scheme
anywhere in the repo to extend.

The consequence is not "thin data", it is **indistinguishable data**. Before this change every session
arriving from a reader's share landed in GA4 as `linkedin.com / referral`, `t.co / referral` or `(direct)` —
which is exactly what the **owner's own** ADR-0038 distribution posts land as. The two populations answer
different questions ("is the writing worth *my* posting effort" vs. "do readers pass it on"), and the
analytics could not tell them apart at all.

So the decision is what to write into the shared URL. And the sharp edge is that the answer is
**effectively immutable**: a tagged URL lives on in someone else's chat history and timeline. A later
rename migrates nothing — it silently splits one series into two, and the split is invisible in the
reporting. These strings get chosen once.

## Decision drivers
- **Separate reader-share from author-post**, which is the entire point of the exercise.
- **Land in GA4's *Organic Social* channel**, so the sessions aggregate with the rest of social rather than
  sitting in *Unassigned* where nobody reads them.
- **Choose values that never need renaming**, because renaming is not available — see above.
- **Measure only what will inform a decision** (ADR-0001, lean by design): every parameter is a permanent
  obligation carried in every shared link, so a parameter that changes no decision is pure cost.
- **Do not weaken [ADR-0033](./0033-ga4-consent-gated-analytics.md)'s hard consent gate** by one byte,
  whatever it costs the measurement.
- **No `iac/` change** — the tagging must not touch the edge or the cache.

## Considered options

### What to tag with
1. **Three parameters — `utm_source` / `utm_medium` / `utm_campaign`** (chosen). Enough to separate reader
   from owner and to name the channel, and nothing else. *Trade-off:* the shared link is longer and uglier
   than a clean URL, permanently, in someone else's feed.
2. **Four parameters — add `utm_content` for the article and/or locale** (offered by the Issue,
   **deliberately dropped**). *Why not:* the share click lands on the **article URL**, so GA4's
   landing-page dimension already carries both the article and — better typed, since the locale is a path
   prefix (ADR-0036) — the locale. `utm_content` would inform no decision `page_path` does not, while being
   a permanent obligation in every link ever shared. Dropping it also dissolves an
   [ADR-0037](./0037-localized-article-slugs.md) trap: slugs are per-locale, so a per-locale `utm_content`
   would have made summing one article across its two editions a manual mapping. And it shortens the URL,
   which reduces the cost the owner accepted in option 1.
3. **No UTM at all — a GA4 `share_click` event on a clean URL.** *Why not (owner's call):* it measures the
   *intent* to share, never the *arrival*. It cannot see whether anyone ever followed the link, which is the
   question. The owner chose full UTM over the clean URL knowingly; the cost is recorded below, including
   the blind spot the rejection creates.

### The literal values
- **`utm_source` ∈ `whatsapp` | `x` | `linkedin` | `share-sheet` | `copy-link`.**
- **`utm_medium` = `social`** — and **not** `social-share` or `share`. GA4's default channel grouping places
  a session in *Organic Social* by matching the medium against its social regex; `social` matches, the other
  two do **not** and fall to *Unassigned*. This bites hardest on **X**, which is not in GA4's built-in
  source-category list (it still knows `twitter`), so the medium is the **only** thing keeping X in the same
  bucket as WhatsApp and LinkedIn. This string is not improvable; it is load-bearing.
- **`utm_campaign` = `reader-share`**, with **`author-post` reserved** for the site author's own ADR-0038
  distribution drafts should they ever be tagged. `author-`, not `owner-`: `reader` is a role toward the
  *content*, and its matched counterpart is the person who wrote it, whereas `owner` is a role toward the
  *property* — a recipient glancing at that value under a personal essay reads a proprietor, which is the
  one register the positioning keeps off every surface. Settled while the value was still reserved and no
  link carried it; the day it is first used it joins the immutable set. The campaign names a **mechanism**
  ("a reader sent this"),
  not a moment and not an article — a value that never needs renaming cannot be renamed wrongly. *Rejected:*
  a per-article or per-launch campaign, which reads better in one report and destroys the series in every
  later one.

### `share-sheet` and `copy-link` as sources
Chosen: **the OS share sheet is its own `utm_source` value**, not a platform name and not untagged.
The sheet genuinely does not tell the page where the reader sent the link, so naming a platform would be a
**fabricated dimension**. *Rejected — leaving the sheet untagged:* worse, and not neutral. The sheet is the
**phone** affordance, phone is where WhatsApp sharing actually happens, so an untagged sheet biases the
count against exactly the channel the pt-BR audience uses most.

**`copy-link` exists because that same rule turned on the first draft of this decision.** `ShareButton`
branches at call time — the Web Share API where it exists, a clipboard copy where it does not — and the
first implementation tagged the URL *once, above the branch*. That stamped `share-sheet` on a desktop
copy-paste: a value naming a mechanism the code had just established did not happen, which is precisely
the fabricated dimension the paragraph above refuses. Caught by `brand-guardian` on the MR, and worth
recording rather than quietly fixing, because the failure was the decision not being applied to its own
fallback path. Two branches, two truthful sources; and by the immutability argument below, had it shipped,
the copy-paste population would have been mixed into the sheet population permanently.

## Decision outcome
Chosen: **three parameters, with the literal values above, defined in one module and nowhere else** —
`apps/fed/src/lib/utm.ts` (`SHARE_MEDIUM`, `SHARE_CAMPAIGN`, `AUTHOR_CAMPAIGN`, `ShareSource`,
`withShareUtm`), consumed by `ShareLinks.tsx` and `ShareButton.tsx`. `utm_content` is **not** emitted.

**One code change beyond the tagging was required, and it is part of the decision.** GA4 reads `utm_*` from
`page_location` on the **first hit of a session**. Here that hit is `gtag('config', …)`, which by
[ADR-0033](./0033-ga4-consent-gated-analytics.md) fires **only after consent**. A *returning* reader who
already granted is fine — consent runs in the mount effect while the URL still carries the parameters. A
**new** reader arriving from a shared link is not: they meet the banner, read, navigate within the SPA and
only then accept, by which point the tagged URL is gone and the session is attributed `(direct)` — precisely
the population the tagging exists to count. So `loadAnalytics` now captures the **arrival URL at module
load** and passes it explicitly as `page_location`. **Nothing is stored and nothing is transmitted before
consent** — the value sits in a module variable and is discarded if consent never arrives — so ADR-0033's
hard gate is preserved exactly, not traded against.

**Success criterion, recorded so it is returned to rather than forgotten:** in the **90 days after deploy**,
at least **10 sessions** carrying `utm_campaign=reader-share`, spread across at least **2 distinct
`utm_source` values**. Below that, the affordance is decoration and the next distribution effort goes to
channels the owner controls. **Baseline is zero by construction** — nothing has ever distinguished a reader
share before, so the first reading *is* the baseline.

**Verified as needing no change:**
- **Canonical / `og:url` / hreflang stay query-free.** `useDocumentHead` builds them from the **route
  constant**, never the live URL — now asserted by an E2E test that requests a UTM-tagged article URL.
- **`iac/` untouched.** CloudFront uses the managed `CachingOptimized` policy, whose query-string
  configuration is `none`, so a tagged URL is the **same cache object** as the clean one: no cache
  fragmentation, no added cost, no infra change ([ADR-0013](./0013-s3-cloudfront-hosting.md)).

## Consequences

**Good**
- Reader shares are separable from the owner's own posts for the first time — the question the affordance
  was built to answer becomes answerable at all.
- All four sources land in the same GA4 channel, including X, which would otherwise scatter.
- The strings live in exactly one module with the reasoning next to them, so the next person to "improve"
  `social` into `social-share` has to read why they must not.
- The success criterion is written down with a deadline and a number, so "did this work" is a check rather
  than a memory.

**Bad / accepted costs**
- **The shared link is uglier, and it carries the reader's name with it** into their feed or chat. The owner
  accepted this explicitly in choosing full UTM over a clean-URL share-click event.
- **Pageview attribution shifts for one reader, and someone will read a number against it.** `config` now
  reports the URL the reader *arrived* on rather than the URL they were on when the script loaded, and
  `usePageviews` still skips its own first run. So the reader who lands on A, navigates to B and only then
  accepts has A recorded and **B never counted at all**. That is the right trade — A is the shared article
  whose reach is being measured, and attributing the session to B would lose the campaign entirely — but it
  means a late-consenting reader's landing page is over-counted relative to the page they were actually
  reading when they accepted. Stated here because a pageview count is read months later by someone who was
  not present for this decision.
- **A drop in *attempted* shares caused by that ugliness is unmeasurable** — because the share-click event
  was rejected, a reader who backed out of an ugly URL reads identically to a reader who never wanted to
  share. **Nobody should later read a low number as "readers don't share."** That inference is not available
  from this data.
- **Per-channel ranking is not-measurable, and will stay so for years.** At these volumes 3-vs-1 is noise,
  and X (`t.co`) and LinkedIn (`lnkd.in`) wrap links with different query-preservation reliability, so the
  channels are measured at *different fidelities*. The success criterion is deliberately **existence-class,
  not ranking-class**; treating the source breakdown as a ranking would be reading precision that is not
  there.
- **Measurement is partial by construction** — GA is consent-gated (ADR-0033), so every number here is a
  floor, read against that gate rather than despite it.
- **"Unconfigured" and "nobody came" are observationally identical.** Analytics is inert when
  `VITE_GA_MEASUREMENT_ID` is unset, so **confirm the id is present in the served bundle before
  interpreting any zero** — otherwise a broken deploy reads as a failed hypothesis.

**Neutral**
- Code-only: no `iac/`, no edge, no cache-behavior change.

## Links
- **Implements** Issue [#272](https://github.com/tedeuxx/tadeumendonca-io/issues/272); makes observable the
  share affordances shipped by [#267](https://github.com/tedeuxx/tadeumendonca-io/issues/267).
- **Constrained by [ADR-0033](./0033-ga4-consent-gated-analytics.md)** — the hard opt-in gate is preserved
  exactly; the arrival-URL capture is what makes attribution survive the gate without weakening it.
- **Refines [ADR-0023](./0023-observability-static-site.md)** — a third thing the static site observes,
  alongside pageviews and the client error surface.
- **Reserves `author-post` for [ADR-0038](./0038-content-distribution-linkedin-and-x.md)** — the author's
  LinkedIn/X drafts emit a clean URL today, so reader-vs-owner separation currently holds *by accident*;
  the reservation is written down so tagging them later cannot collide with `reader-share`.
- **Avoids an [ADR-0037](./0037-localized-article-slugs.md) trap** — per-locale slugs would have made a
  per-locale `utm_content` a manual cross-edition mapping; dropping the parameter removes the problem.
- **Consistent with [ADR-0013](./0013-s3-cloudfront-hosting.md)** — `CachingOptimized` ignores query
  strings, so tagged and clean URLs share one cache object; `iac/` untouched.
- **Consistent with [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — three parameters, not
  four; the dropped one is the whole argument.
- Implementation: `apps/fed/src/lib/utm.ts`, `apps/fed/src/lib/analytics.ts`,
  `apps/fed/src/components/ShareLinks.tsx`, `apps/fed/src/components/ShareButton.tsx`.

## Amendment (2026-08-01) — `share-sheet` loses its only emitter, mid-measurement-window

**What changed.** [#314](https://github.com/tedeuxx/tadeumendonca-io/issues/314) unified the article's
two share affordances behind one destination list. The header control now opens a modal rendering the
same targets the footer block renders; it no longer calls the Web Share API. **Nothing emits
`utm_source=share-sheet` any more.**

**The value stays defined and must not be deleted.** This ADR's own reasoning applies to itself: a
campaign literal is effectively immutable once shared, so links already in the wild still carry
`share-sheet` and still arrive. Removing the value from the type would orphan rows that are still
being generated by readers clicking links sent weeks ago.

**Three sentences in the text above are now historical rather than current**, and are superseded here
rather than rewritten:

- *"`utm_source` ∈ whatsapp | x | linkedin | share-sheet | copy-link"* — still the full set of values
  that can **arrive**; `share-sheet` is no longer one that can be **emitted**.
- *"Chosen: the OS share sheet is its own `utm_source` value"* — the decision was right and is not
  reversed; its subject was removed by a later slice, which is a different thing from the decision
  being wrong.
- *"`ShareButton` branches at call time — the Web Share API where it exists, a clipboard copy where it
  does not"* — there is no branch. It opens a dialog, and the copy option inside it is one of four.

**Why the sheet went, in one line, since this record is where someone will look:** it is an OS surface
the footer block cannot offer, so keeping it meant not unifying. The capability loss is real — on a
phone the sheet reaches apps a web modal cannot — and it is argued at the call site rather than
glossed.

### The measurement consequence, written down because nobody will remember it in October

This ADR's success criterion is *"in the 90 days after deploy, at least 10 sessions carrying
`utm_campaign=reader-share`, across at least 2 distinct `utm_source` values."*

That window opened around 2026-07-30. **This change alters the emitter population two days into it.**
So when the criterion is read:

- The **"at least 2 distinct sources"** half is unaffected in substance and arguably easier — the modal
  offers four emitting sources (`whatsapp`, `x`, `linkedin`, `copy-link`) where the header previously
  offered two, one of which was the sheet.
- Any `share-sheet` rows in the window are from **before this deploy**, or from links shared before it
  and clicked after. They are real reader shares and should be counted as such; they are not evidence
  about the current affordance.
- The window is **not** restarted. Restarting it would trade a small interpretive footnote for another
  90 days of no answer, and the criterion is about whether readers share at all — which the change does
  not reset.

Implementation after this amendment: `apps/fed/src/lib/utm.ts`, `analytics.ts`,
`components/shareTargets.ts` (the destination list), `components/ShareModal.tsx`,
`components/ShareLinks.tsx`, `components/ShareButton.tsx`.
