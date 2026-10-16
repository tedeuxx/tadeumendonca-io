# 0039. Reader shares are campaign-tagged — three immutable UTM parameters, no `utm_content`

- **Status:** accepted · **amended 2026-08-01** (`share-sheet` loses its only emitter when #314 unifies the two share affordances; the value stays defined, and the 90-day success-criterion window is affected two days in) · **amended 2026-08-16** (`author-post` is exercised — the `/architecture` launch is tagged on LinkedIn and X; no parameter changes, and the tagging is a manual step with no gate) · **amended 2026-10-16** (a third `utm_campaign` value, `author-profile`, for the links on the author's own LinkedIn and X profiles, measured apart from his posts; hand-placed, no code change)
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

## Amendment (2026-08-16) — `author-post` is exercised: the reservation becomes a used value

**Nothing is decided here.** The values were settled on 2026-07-30 and this record made itself
self-executing about the moment they stop being provisional: *"Settled while the value was still
reserved and no link carried it; the day it is first used it joins the immutable set."* That day is
today, so the record says what it was already obliged to say — the reservation was exercised, when,
and on what.

**What was exercised.** The owner approved tagging the ADR-0038 launch distribution for
`https://tadeumendonca.io/en/architecture` and `https://tadeumendonca.io/pt/architecture`, on LinkedIn
and X in one batch. Per channel:

| | LinkedIn | X |
|---|---|---|
| `utm_source` | `linkedin` | `x` |
| `utm_medium` | `social` | `social` |
| `utm_campaign` | `author-post` | `author-post` |

**Nothing is added to any parameter, and that is the point.** `utm_source` already closed over
`whatsapp | x | linkedin | share-sheet | copy-link`, so `linkedin` and `x` are existing members —
`ShareSource` in `apps/fed/src/lib/utm.ts` is unchanged. `utm_medium` is `social` for the reason this
record already argues at length and which is load-bearing on X specifically (GA4's default channel
grouping matches its social regex; `social-share` and `share` fall to *Unassigned*). `utm_campaign`
takes the value this record reserved, spelled exactly as reserved. The third parameter is the only
one whose *population* changes: `utm_campaign` now has two live values rather than one, which is what
the reservation existed to make possible without a collision.

**The destination is a static route, not an article, and it reopens nothing.** The option group that
could have been reopened is *"four parameters — add `utm_content` for the article and/or locale"*, and
its rejection rested on *"the share click lands on the **article URL**, so GA4's landing-page dimension
already carries both the article and — better typed, since the locale is a path prefix (ADR-0036) — the
locale."* Substitute a static route and the argument survives unchanged: `/en/architecture` and
`/pt/architecture` are two distinct prerendered routes (`apps/fed/scripts/routes.mjs`'s `STATIC_ROUTES`
carries `/architecture`; ADR-0036 makes the locale a path prefix for static routes exactly as for
articles), so `page_path` still carries both the page and the locale and `utm_content` would still
inform no decision it does not. The ADR-0037 half of that rejection — per-locale slugs making a
per-locale `utm_content` a manual cross-edition mapping — simply does not arise for a route whose
segment is identical in both locales. **`utm_content` stays not emitted.**

**The tag is applied by hand, and there is no gate.** `apps/fed/scripts/gen-distribution.mjs` emits a
bare canonical URL and holds no UTM logic at all; more than that, it **cannot produce a draft for a
static route** — it reads `src/content/blog/` and resolves the share URL by lookup on the key
`/blog/<en-slug>`, so a route that is not an article has no entry into it. `AUTHOR_CAMPAIGN` is
exported from `apps/fed/src/lib/utm.ts` and asserted in `utm.test.ts`, and **no production caller
passes it** — the constant names the value so it cannot be mistyped, it does not apply it. So an
untagged author post is a real and undetectable state. This is not a new limit: it is the same one
ADR-0038 already records for the fan-out itself — *"Still manual, therefore still skippable. This ADR
makes the omission visible, not impossible; no gate enforces it"* — now true of the tag as well as of
the post. Recorded, not proposed as work; only the owner opens work.

**What this does not touch.**

- **[ADR-0033](./0033-ga4-consent-gated-analytics.md)'s consent gate is untouched.** A tagged URL is
  read from `page_location` on the first hit, and the first hit is still `gtag('config', …)` after
  consent. An unconsented session stays invisible, by design; tagging a link does not make a reader
  countable who was not countable before. Every number under `author-post` is a floor, read against the
  gate exactly as `reader-share`'s is.
- **`reader-share` is unchanged** — same medium, same sources, same emitters, same module.
- **The success criterion is about `reader-share` and does not move.** *"In the 90 days after deploy, at
  least 10 sessions carrying `utm_campaign=reader-share`, spread across at least 2 distinct
  `utm_source` values"* — that is a threshold for judging **the reader share affordance**. Author posts
  carry a different campaign value and are outside it by construction. **Nothing in this amendment may
  be read as contributing to, relaxing, or restarting it**, and the separation it depends on is exactly
  what tagging the author's own posts finally makes real rather than accidental.
- **No `iac/`, no code, no cache behaviour.** `CachingOptimized` ignores query strings
  ([ADR-0013](./0013-s3-cloudfront-hosting.md)), and canonical/`og:url`/hreflang are built from the
  route constant, not the live URL.

**No claim is made about whether this works.** The campaign has no data and today is its first day;
what the numbers mean, and whether the author-vs-reader split is worth its cost, is a later reading
against a later record.

**On ADR-0038: a cross-link, not a second amendment.** The obvious alternative was to amend
[ADR-0038](./0038-content-distribution-linkedin-and-x.md) too, since the posts being tagged are its
posts. Rejected: nothing ADR-0038 decides changes. It decides *that* a publication reaches both
surfaces with the canonical URL; the canonical URL is still what is shared, and a query string on it
is neither a shortener nor a different destination. Recording one decision in two places is how a
library starts disagreeing with itself, so ADR-0038 gets a dated pointer in its Links section and this
record keeps the reasoning.

## Amendment (2026-10-16) — a third campaign value, `author-profile`

**Decided by the owner** on Issue [#749](https://github.com/tedeuxx/tadeumendonca-io/issues/749)
(intake decision 5, 2026-10-16, option *"Tag nova author-profile"*); written by tech-lead. This one
**does** decide something, unlike the 2026-08-16 amendment: it adds a member to the `utm_campaign` set
this record closed.

### Context

The author's LinkedIn profile carries a website link and his X profile may carry one too. Both point at
the site's root, `https://tadeumendonca.io/`. Untagged, a visit from either lands in GA4 as
`linkedin.com / referral`, `t.co / referral` or `(direct)`, the same buckets an untagged post or a
stripped reader share lands in. The owner wants traffic that starts on his **profile** measured apart
from traffic that starts on one of his **posts**. The two answer different questions: *"does the
profile itself send people to the site"* against *"is a given publication worth posting"*.

### Considered options

1. **A new campaign value, `author-profile`** (chosen). *Trade-off:* the immutable set grows by one
   value, permanently. A third value is one more series to read, and one more spelling that could be
   mistyped by hand (see the consequences).
2. **Reuse `author-post`.** *Why not:* it merges the two populations the owner asked to separate. It
   would also change what `author-post` means after it has been in use for two months: rows before this
   date would be posts only, rows after would be posts and profile visits. The silent split in meaning
   is the same failure as a rename.
3. **Leave the profile links untagged.** *Why not:* profile traffic stays indistinguishable from
   referral traffic of every other origin, which is the question this record exists to make answerable.
4. **A per-network value such as `linkedin-profile` and `x-profile`.** *Why not:* the network is already
   `utm_source`. Encoding it a second time in the campaign duplicates a dimension and names a platform
   rather than a mechanism, the shape this record rejected for per-article and per-launch campaigns.

### Decision

| | LinkedIn profile link | X profile link |
|---|---|---|
| `utm_source` | `linkedin` | `x` |
| `utm_medium` | `social` | `social` |
| `utm_campaign` | `author-profile` | `author-profile` |

**Meaning:** *"the visitor followed the link on the author's own social profile."* It names a
mechanism, like `reader-share` and `author-post`, and the `author-` prefix keeps the reasoning this
record already gives against `owner-`. `utm_campaign` now has three values:

- `reader-share`: a reader sent the link;
- `author-post`: the author posted the link;
- `author-profile`: the link sits on the author's profile.

**Owner of the value:** the owner. He writes it into the two profile fields by hand, and this record
fixes its spelling. **No parameter other than `utm_campaign` changes.** `linkedin` and `x` were already
members of the closed `utm_source` set, `social` is unchanged for the reason this record gives, and
`utm_content` stays not emitted. The destination is the bare root, a prerendered route (`'/'` in
`apps/fed/scripts/routes.mjs`'s `STATIC_ROUTES`), so `page_path` already says where the visit landed.

**It joins the immutable set on its first use**, by the clause this record already carries: *"the day it
is first used it joins the immutable set."* A profile link can be edited, unlike a link in someone
else's chat, but the rows it has already produced cannot. A later rename would split the series exactly
as the context section describes.

**Ordering:** this amendment merges before any tagged profile link is posted, so a link never carries a
value the record does not define.

### What this does not touch

- **[ADR-0033](./0033-ga4-consent-gated-analytics.md)'s consent gate.** The arrival URL is still
  captured at module load (`landingLocation` in `apps/fed/src/lib/analytics.ts`) and sent only after
  consent. An unconsented profile visit stays invisible; every `author-profile` number is a floor.
- **`reader-share` and its success criterion.** The criterion counts `reader-share` sessions only.
  `author-profile` sessions are outside it by construction and neither contribute to it nor restart it.
- **`author-post`.** Its meaning and its population are unchanged.
- **No `iac/` and no cache behaviour.** `CachingOptimized` ignores query strings
  ([ADR-0013](./0013-s3-cloudfront-hosting.md)); canonical, `og:url` and hreflang are built from the
  route constant.

### Consequences

**Good**
- Profile-originated traffic becomes separable from post-originated traffic for the first time.
- The separation costs no code, no deploy and no infrastructure.

**Bad / accepted costs**
- **The value is not in `apps/fed/src/lib/utm.ts`.** The decision outcome above says the literals are
  *"defined in one module and nowhere else"*. That clause holds for the values the site's own code
  emits or reserves. `author-profile` is never emitted by the site: it is typed into a field on LinkedIn
  and X. A constant with no caller would name the value without applying it, as `AUTHOR_CAMPAIGN`
  already does. So the spelling is fixed here, in this record, and in no module. Nothing checks the
  string the owner types. A typo such as `author_profile` would start a separate series that nothing
  would flag. Check the two profile fields against the table above after posting them.
- **Hand-placed and ungated**, like `author-post` (2026-08-16 amendment). A profile link left untagged,
  or later edited back to a clean URL, is a real state that nothing detects.
- **Query-string survival through each network's profile link is not measured.** Whether LinkedIn's
  profile website field and X's (wrapped by `t.co`) preserve the query string is a premise. The first
  reading in GA4 is the first evidence either way. If the parameters are dropped, those visits fall
  back to referral and the `author-profile` count reads low.
- **No success criterion is set.** Volumes are expected to be small, and no number was decided. Read the
  series as existence-class, as the reader-share criterion already is, never as a ranking between the
  two networks.

**Refs** Issue [#749](https://github.com/tedeuxx/tadeumendonca-io/issues/749).
