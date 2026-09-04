# 0051. The GA4 custom event schema is immutable once shipped — names chosen for what the browser can observe, a two-part parameter spine, and a non-retroactive registration obligation

- **Status:** accepted
- **Date:** 2026-09-04
- **Deciders:** **`tech-lead`**, at intake on [#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597)
  (2026-09-04, jointly with `product-lead`), which is where the record was called for and where findings
  2, 4 and 5 below were settled; written by `tech-lead` in the MR that implements it
  ([PR #601](https://github.com/tedeuxx/tadeumendonca-io/pull/601)), per the authorship split that puts a
  record in the same MR as the change it justifies. **The owner decided WHAT the two funnels are** — the
  content funnel's terminal is *«o conteudo foi tao valido que a pessoa ate multiplicou»* and the career
  funnel's is being contacted, the platform's stated purpose (*«recrutamento passivo no linkedin»*) — and
  **none of the names.** Three of the five names are the result of applying the immutability rule against
  what the owner would have preferred them to mean, which is the whole reason this record exists.
- **Supersedes / superseded by:** —
- **Driven by:** [#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597) ·
  **constrained-by [ADR-0033](./0033-ga4-consent-gated-analytics.md)** (the hard opt-in gate — every name
  below is silent for a reader who has not consented, and this slice repairs the one place that was not
  true) · **refines [ADR-0023](./0023-observability-static-site.md)** — a **fourth** thing the static site
  observes, alongside pageviews, the client error surface and the campaign tagging of
  [ADR-0039](./0039-share-campaign-tagging.md) · **stands alongside
  [ADR-0039](./0039-share-campaign-tagging.md)**, which rejected a share-click event *as a substitute for
  UTM* — see *The ADR-0039 reconciliation* below, which is not optional reading · spends
  [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md).

## Context & problem

[ADR-0033](./0033-ga4-consent-gated-analytics.md) recorded, in 2026-07, that the owner wanted **"rich
behavioral data (funnels, retention, cross-page paths, audience) … not just hit counts"**, and that he
chose GA4 over a cookieless tracker knowing the cost — he **"weighed this squarely and chose the data
over the tighter positioning fit."** The implementation stopped at `page_view`. **So this is not the
addition of tracking; it is the discharge of a decision already on the record whose implementation was
one event deep.** That framing matters for how the change is read on a site whose thesis is restraint,
and it is why this record is not `ESCALATE` class: no new claim is made about the reader.

**What actually needed deciding is the SCHEMA, and the schema is effectively immutable.** This is the
same edge ADR-0039 met with the UTM literals and stated in its own words: *"a later rename migrates
nothing — it silently splits one series into two, and the split is invisible in the reporting."* GA4
behaves identically for event names and for registered custom dimensions. Rename `article_end_reached`
next year and GA4 does not migrate a single historical row; it opens a second series, leaves the first
sitting there looking complete, and nothing in any report says the two are one thing. **These strings
are chosen once, by whoever ships them first, on behalf of everyone who reads a number afterwards.**

Two further properties make the schema architectural rather than a config detail:

1. **It is a cross-cutting pattern.** Every component that ever emits — slice B's `share_open`,
   `contact_reach`, `outbound_click`, and whatever is instrumented in a year — emits *against this
   spine*. A parameter admitted here is admitted everywhere, permanently.
2. **A parameter is not queryable until it is registered as a custom dimension in the GA4 console, and
   registration does not backfill.** Nothing in this repository named that step before this record —
   `grep -rin "custom dimension|key event" docs/ apps/fed/src/ CLAUDE.md` returned no output at intake.
   It is a step outside the repository, invisible to every gate, and **anything emitted before its
   dimension exists is unqueryable for that period, permanently.**

And the naming pressure runs one way, which is the thing to notice before reading the options. Every
name the owner would find most useful — `read`, `share`, `scroll` — claims **more than the browser can
observe**. A name that overclaims is not a small cost paid once: it is read as a fact for years by
people who were not present, and it cannot be corrected without destroying the series.

## Decision drivers

- **Choose names that never need renaming**, because renaming is not available — ADR-0039's argument,
  applied to events and dimensions instead of campaign literals.
- **A name must state what the page can OBSERVE, never what we would like it to mean.** The name outlives
  everyone present for the decision; the caveat in the pull request does not.
- **Do not weaken [ADR-0033](./0033-ga4-consent-gated-analytics.md)'s hard consent gate by one byte** —
  and, here, repair the place where it was already weaker in fact than on paper.
- **Every parameter is a permanent obligation and a scarce registration slot**
  ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)) — a parameter that informs no decision,
  or that duplicates one GA4 already derives, is pure cost. This is exactly the trade ADR-0039 made when
  it dropped `utm_content`.
- **Carry no free-form URL and no identifier.** A query string is where PII eventually appears.
- **Introduce no DOM node.** `scripts/prerender.mjs` serialises the DOM via `page.content()`; listeners
  and observers never reach the snapshot, but a sentinel `<div>` changes served bytes and can move
  `page-heading-measure.spec.ts` and `responsive-overflow.spec.ts`. A constraint, not a risk.

## Considered options

### 1 · The content funnel's denominator: what to call "the reader got to the end"

1. **`article_end_reached`** (chosen) — names the observation and nothing beyond it. *Trade-off:* it is
   longer, it is less satisfying in a report, and a reader of the number still has to be told it is a
   proxy. That telling is what this record is for.
2. **`read`** — *why not, and it is the sharpest call in the schema:* **nothing a client can see proves a
   read.** What is established is that the last block of the prose entered the viewport, that the deepest
   intermediate block did too, and that enough time passed for the words to have been *possible* to read.
   That is a strong proxy and it is not a read. **`read` is a claim the data cannot carry**, and — unlike
   a wrong threshold — it cannot be fixed later, because the fix is a rename and a rename splits the
   series. Rejected on the immutability argument, not on taste.
3. **GA4's document-scroll depth (the built-in 90% / a custom 100%)** — *why not:* **document-100% is not
   the end of an article on this site.** Below the prose sit the share block, a second share trigger, the
   footer back-link and the contact footer, so a reader who read every word and stopped is at roughly 80%
   of the document while an End-key press is at 100% having seen nothing. On the landing, 100% is often
   reached at load. The same number is not even comparable across page types, which is worse than a
   missing number.

### 2 · The intermediate milestone: `article_progress`, not `scroll`

Chosen: **`article_progress`**, carrying `percent ∈ {25, 50, 75}` computed over the article's **block
count**, not pixel offsets.

*Rejected — `scroll`:* it collides with **GA4's own enhanced-measurement event name**, which carries
`percent_scrolled` and fires at 90%. A custom `scroll` puts two differently-shaped populations under one
name — the exact failure this whole record exists to prevent — and whether the built-in is enabled is a
property setting **nothing in this loop holds a credential to check.** Renaming to avoid a collision we
cannot verify is cheap; discovering the collision afterwards is not fixable at all.

### 3 · The content funnel's terminal: `share_complete`, which cannot see a completed share

Chosen: **`share_complete`**, emitted from **both** entry points (the footer `ShareLinks` block and the
`ShareModal`), carrying `target`.

**The ceiling is stated rather than encoded into the name.** Both entry points open the destination in a
new tab, so what the page observes is that **a composer was opened** — never that anything was posted.
The name is kept because it names the act *the reader performed on this page*, and because
`share_attempted` would have been just as unfalsifiable in the other direction. **The only evidence a
share actually happened is an inbound `reader-share` session** (ADR-0039), which measures a different
population, at a different time, and does not substitute for this one.

*Rejected — a longer, self-caveating name (`share_composer_opened`):* honest, and nobody reads a name
that long as anything but noise; the caveat then lives in a name instead of in a record where it can be
argued. The trade is deliberate — **this record is where the ceiling is enforceable, and the name is not.**

### 4 · The career funnel's terminal: `contact_click`, classified by EXACT HREF

Chosen: **`contact_click`**, carrying a `target` drawn from a closed union
(`github | linkedin | x | whatsapp | email`), resolved by **exact-href lookup** against the single channel
list, through **one delegated listener** on the shell's existing root element.

*Rejected — classification by hostname:* **three of the five contact channels share a hostname with a
share destination** (`linkedin.com`, `x.com`, `wa.me`). A hostname rule reports every share to LinkedIn
as a click on the owner's profile — **the career funnel's terminal event inflated by the content funnel's
traffic, with both numbers still looking entirely plausible.** That is the worst class of measurement
defect available here: not a gap, a wrong answer that reads as a right one.

*Rejected — carrying the `href` on the event:* `target` is a closed vocabulary, so nothing can grow a
query string. This is **stronger** than the intake's own bound-the-href-to-hostname-plus-path rule, and
that rule therefore binds slice B's `outbound_click` — which cannot use a closed vocabulary — rather than
this event.

*Rejected — per-anchor `onClick` handlers:* the channels render from one list through two components, and
the landing renders one of them twice. Four call sites for one event, and the fifth surface to render the
list is the one that forgets.

### 5 · The parameter spine: `locale` in, `path` out

Chosen: **`locale` on every event, mandatory at the type level**, plus each event's own narrow
parameters (`slug`, `percent`, `target`). **`path` is deliberately NOT emitted and must not be added.**

- **Why `path` comes off:** GA4 attaches `page_location` to every hit and derives `page_path` from it for
  free. A custom `path` duplicates a dimension the property already has **and spends one of its
  registration slots on the duplicate** — *the exact trade [ADR-0039](./0039-share-campaign-tagging.md)
  refused when it dropped `utm_content`.* This overrides acceptance criterion 4 of #597 as filed, which
  asked for `path` on every event; the criterion was right about wanting the cut and wrong about where
  the data comes from.
- **Why `locale` stays, although it is derivable:** the locale is a path prefix
  ([ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)), so it *is* recoverable from `page_path` — by
  writing a regex inside an Exploration, every time, by hand. **A registered dimension is a segment you
  click.** That is the whole of the argument, and it is a deliberate, priced exception to the
  no-duplicates rule that killed `path`: `path` duplicates a dimension GA4 already *derives and exposes*,
  `locale` duplicates one it only *contains*.
- **Mandatory at the type level, not by convention.** A dimension present on four events out of five
  cannot segment anything, and nothing else in this repository would notice its absence.

### 6 · Where the vocabularies live

Chosen: **`ShareCompleteTarget` extends ADR-0039's `ShareSource`** (imported, not restated) and
**`ContactTarget` is defined in the schema module and imported by the channel list.**

*Rejected — restating the share destinations:* a share to LinkedIn tagging `linkedin` on the URL and
reporting `LinkedIn` on the event is two series for one act, and nothing would ever have said so.
*Rejected — defining `ContactTarget` in the component:* the reverse dependency would put a **registered
dimension's vocabulary** in a file nobody opens when reading the events.

## Decision outcome

**The schema, as shipped. Every name below is immutable from the moment it collects.**

| event | parameters (beyond `locale`) | what it observes — and what it does not |
|---|---|---|
| `article_progress` | `slug`, `percent ∈ {25,50,75}` | a block at that share of the article's block count entered the viewport. Its own value is modest; its job is to be a precondition |
| `article_end_reached` | `slug` | the last block of the **prose** entered the viewport, the deepest milestone had already fired, and the dwell floor elapsed. **A proxy for a read. Not a read** |
| `share_complete` | `target` (`ShareSource` ∪ `copy-markdown`) | a share destination was chosen and a composer opened. **Never that anything was posted** |
| `contact_click` | `target` (`github`\|`linkedin`\|`x`\|`whatsapp`\|`email`) | a contact channel was clicked through. **Never that contact was made** — an approach happens on LinkedIn or by email and is invisible to this site by construction |
| `page_view` | `page_path` | unchanged from ADR-0033; listed because it is part of the spine a reader will meet |

**The single emission point is `trackEvent` in `apps/fed/src/lib/analytics.ts`, and that is mechanical
rather than a habit:** `window.gtag` is a global and a global is reachable from anywhere by typing its
name, so an ESLint `no-restricted-properties` rule (`eslint.config.mjs`) makes every other module's use
of it an error. **Its stated limitation is written into the config:** `window['gtag']` and a destructured
`const { gtag } = window` walk straight past it.

**What a name may never be changed to.** `article_end_reached` may never become `read`, `article_read` or
anything else asserting comprehension; `article_progress` may never become `scroll`; `share_complete` may
never be narrowed to a name implying a posted share nor widened to one covering a merely-opened share
sheet. **A name is not improved. If the observation changes, that is a NEW name and a new series**, and
the old one stops being emitted rather than being redefined under the same string — the same discipline
ADR-0039 applies to `share-sheet`, whose value stays defined precisely because links in the wild still
carry it.

### The consent gate: repaired, not merely extended

**This slice moves the property from *cannot be un-injected* to *loaded but silent*, which is what
ADR-0033's hard gate implies and did not deliver.**

The guard was `injected` alone, which answers a question about the **script** ("is gtag loaded") when the
question that matters is about the **reader** ("does this person currently consent"). The two came apart
the moment withdrawal became reachable: `reopen()` calls `clearConsent()` and returns the status to
undecided **while `injected` stays true.** ADR-0033 states this correctly of the injection — *"it cannot
be un-injected"* — and it was silently read as being true of the **emission** too. Until this slice that
cost page_views from a reader who had withdrawn. With interaction events it would have cost
`contact_click`: **a reader who withdrew consent and then clicked through to LinkedIn would still have
been reported**, which is the one thing this site's consent copy promises does not happen.

Every emission now re-reads `readConsent()`, per call rather than cached — the withdrawal happens in
another component, in the same session, with no event this module subscribes to, so a cache here would be
the same staleness one layer down. **Mutation-checked against the source rather than read:** removing
`readConsent() === 'granted'` from `mayEmit` reddens six assertions across four files, covering the
granted / never-granted / withdrawn-after-granted set.

**The observer is created at the GRANT, not at mount**, and that is part of the consent design rather
than an implementation detail — see finding 1 below.

### The registration obligation, and it is non-retroactive

**A parameter that is not registered as a custom dimension is collected and invisible** in standard
reports and Explorations (DebugView and BigQuery only), and **registration does not backfill.** Two
console actions are therefore part of this decision and are **owed at merge, not later**:

1. **Mark two key events** — `share_complete` (content funnel) and `contact_click` (career funnel). GA4
   supports several; a property with one key event can only describe one of the two things this site is
   for.
2. **Register the custom dimensions**, event-scoped: `locale` (every event), `slug`, `percent`, `target`
   — one dimension covers `target` on both events that carry it — **and slice B's `source_section`,
   `href`, `from`/`to` NOW**, before they emit, or B's first weeks are permanently unqueryable.

**Marking key events and registering dimensions is CONFIGURATION, not a record.** It is stated here
because the obligation is architectural and the console is outside every gate — not because this record
tracks it. **Nothing in this repository can observe whether it was done**, and a schema that emits into
unregistered dimensions looks exactly like one that emits into registered ones. That gap is the reason
this section exists and is not closable from here.

## The ADR-0039 reconciliation — stated explicitly, or the two records read as disagreeing

**[ADR-0039](./0039-share-campaign-tagging.md) rejected a share-click event.** Its *"Considered options"*
→ *"What to tag with"* option 3 is **"No UTM at all — a GA4 `share_click` event on a clean URL"**,
refused on the owner's call because *"it measures the intent to share, never the arrival. It cannot see
whether anyone ever followed the link, which is the question."*

**This record adds one. That is not a reversal, and the difference is the word *substitute*.**

- **ADR-0039 rejected the event AS A REPLACEMENT FOR UTM tagging.** The question it was answering was
  *did anyone arrive from a reader's share*, and a click event cannot answer it — the URL is what
  survives into someone else's chat history and comes back as a session.
- **This record adds the event ALONGSIDE the tagging**, answering a different question: *did anyone on
  this page choose to share at all, and to where.* ADR-0039 itself names the blind spot its rejection
  creates and asks for it to be respected: *"A drop in attempted shares caused by that ugliness is
  unmeasurable — because the share-click event was rejected, a reader who backed out of an ugly URL reads
  identically to a reader who never wanted to share."*

**So `share_complete` closes ADR-0039's own recorded blind spot without touching its decision.** Nothing
about the UTM scheme changes: three parameters, the same literals, `utm_content` still not emitted,
`utm.ts` still the one module. **The two records measure two populations at two moments** — an intent on
this page, and an arrival on someone else's click — and **neither number may be divided by the other.**
They are not the same denominator: a reader can open three composers and post nothing, and a session can
arrive from a link shared weeks ago by someone who never met this instrumentation.

**And ADR-0039's success criterion is untouched.** *"In the 90 days after deploy, at least 10 sessions
carrying `utm_campaign=reader-share`, spread across at least 2 distinct `utm_source` values"* is a
threshold about **arrivals**. Nothing here contributes to it, relaxes it or restarts it.

## Three findings from the build that constrain the terminal metric, not just the code

These are recorded because each one bounds what `article_end_reached` **means**, and a reader of the
number a year from now will not have the pull request.

### 1 · The observer must start at the GRANT, and the reason is a silent zero

The milestones are one-shot: a block that has intersected is unobserved and never reported again.
Observing from mount therefore **consumes** every milestone already on screen while the consent banner is
still up — silently, because the emitter no-ops — so a reader who accepts a moment later has already
spent the preconditions the terminal event depends on. **Measured on the built site: the article emitted
nothing at all for the whole visit.** Creating the observer at the grant also restarts the dwell clock
there, which is conservative in the right direction — a reader who accepts on the last paragraph gets a
fresh floor and is not counted as having read.

### 2 · The milestone precondition is NARROW on this site, and must not be sold as more

The precondition is the **deepest** milestone (75%), not *any* milestone — measured, because on a real
article at 1280×720 the first screenful already contains the 25% block, so that milestone fires at load
and an End-key leap satisfied the condition and **emitted `article_end_reached`.**

**But its reach on this site is small, and this is the finding.** `apps/fed/src/styles/index.css` sets
`html { scroll-behavior: smooth }` inside a `@media (prefers-reduced-motion: no-preference)` block, so
for most readers **an End press animates to the bottom and every block genuinely passes through the
viewport** — there is no leap for an observer to miss, because the browser did not leap. The same
stylesheet resets `scroll-behavior: auto !important` under `prefers-reduced-motion: reduce`, and **that
is the only configuration where this condition does the work its name suggests** — which is the
configuration the E2E asserts it in.

**So for most readers of this site, the DWELL FLOOR is what separates a scroll-past from a read.** The
milestone condition is kept because it costs one `Set` lookup and is the only cover for the
reduced-motion reader — **not** because it is doing the work a naive reading suggests. A second, smaller
ceiling compounds it: on an article under about two viewports tall the first screen holds the 25% block
and the last holds the 75%, so there is nothing to leap over at all. This site's shortest article is one
of those.

The floor itself is derived from the article's own length at **1,000 words per minute** — deliberately
*not* an average reading speed (an average would suppress fast readers, who are exactly this site's
audience) but the boundary of the physically implausible, with a 5s minimum for very short pieces. It is
generous by design: a determined skimmer clears it, which is the cheaper error.

### 3 · What the proxy still cannot see, with its direction of error

A reader who scrolls through at a plausible pace with the tab in the background is **over-counted**; one
who reads carefully and closes the tab a paragraph early is **lost**. Stated with a direction rather than
as a general caveat, because a caveat with no direction cannot be reasoned about.

## Consequences

**Good**
- **Both funnels have a terminal event for the first time**, and the career funnel — the platform's
  stated purpose — had none at all. `/#contato` was a first-class nav item emitting nothing.
- **The consent posture is materially strengthened, not merely preserved.** A live production defect is
  repaired *while* widening what is collected, which is the right order of operations, and it is the one
  thing here that would have been worth doing with no events at all.
- **The naming rule is written down with three worked applications**, so the next person to "improve"
  `article_end_reached` into `read` has to read why they must not — the same property ADR-0039 bought by
  putting `social` in one module with its reasoning beside it.
- **No free-form URL and no identifier can enter the schema by accident**: `contact_click` takes a union,
  and the type system forecloses the query string rather than a convention discouraging it.
- **The single emission point is enforced by a lint rule**, not by habit.

**Bad / accepted costs**
- **The registration obligation is outside every gate and non-retroactive.** If the console actions are
  not taken at merge, the events collect into invisibility for that period **permanently**, and
  everything in the repository stays green while it happens. This is the sharpest unmitigated cost in the
  record.
- **`article_end_reached` is a proxy and will be read as a fact.** It carries a stated direction of error
  and two ceilings, and none of that travels with the number into a report. **The name is the only part
  of this that is load-bearing at read time**, which is why so much of this record is spent on it.
- **`share_complete` names an act it cannot confirm.** It counts composers opened. At this site's volume
  it is a **counter with provenance, never a rate** — the terminals need roughly 1,160 sessions per
  period to be a rate at all, and the per-article cut is noise for at least a year. **Nobody should read
  three shares as a trend**, and acceptance criterion 4 of #597 as phrased is an invitation to publish
  exactly the figure criterion 5 exists to prevent.
- **Every number here is a floor, twice over** — consent-gated (ADR-0033) and ad-blocked (ADR-0023). The
  consent repair *lowers* it further in the honest direction: a withdrawn reader now genuinely disappears
  rather than continuing to be counted.
- **The `percent` dimension is computed over BLOCK COUNT, not reading length.** A 25% block in an article
  with two long code fences is not a quarter of the reading. The number is a milestone index wearing a
  percentage sign, and it should not be averaged.
- **The exact-href classifier is exact by choice, and a future channel is where it breaks.** A relative or
  unusually-encoded href would silently classify as "not a contact channel" and emit nothing — the safe
  failure direction, and still a real one, with nothing to announce it. Measured and recorded rather than
  implied: swapping `anchor.getAttribute('href')` for the `.href` property leaves the whole suite green
  today, so **no test discriminates the two spellings**; the attribute is chosen as the one that cannot
  go wrong later, not as a defect the tests would catch.
- **This is half a schema.** Slice B (`share_open`, `contact_reach`, `outbound_click`, and whatever the
  unresolved `nav_click` disagreement becomes) emits against this spine and is not built. The middle of
  both funnels — where they leak — is unmeasured, and readable only at volumes this site does not have.

**Neutral**
- Code-only: no `iac/`, no edge, no cache behaviour, no new DOM node (`ref=` and `onClick=` on elements
  that already existed; React serialises neither).

## Links
- **Implements** [#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597) slice A, in
  [PR #601](https://github.com/tedeuxx/tadeumendonca-io/pull/601).
- **Constrained by [ADR-0033](./0033-ga4-consent-gated-analytics.md)** — and **repairs** the gap between
  that record's hard gate and what it delivered; 0033 is amended to point here, and its
  *"it cannot be un-injected"* consequence is struck there rather than rewritten.
- **Refines [ADR-0023](./0023-observability-static-site.md)** — a fourth thing the static site observes.
- **Stands alongside [ADR-0039](./0039-share-campaign-tagging.md)** — which rejected a share-click event
  as a *substitute* for UTM. See *The ADR-0039 reconciliation* above; the two measure two populations at
  two moments and neither divides the other.
- **Applies [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)** — the locale is a path prefix,
  which is why `locale` is a duplicate GA4 only *contains* rather than one it *derives*.
- **Spends [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — five events and four
  dimensions, each a permanent obligation; `path` is the one that was refused.
- Implementation: `apps/fed/src/lib/analytics.ts` (the schema, the named emitters and the two-condition
  consent gate), `apps/fed/src/hooks/useArticleProgress.ts`, `apps/fed/src/hooks/useContactClicks.ts`,
  `apps/fed/src/components/contactChannels.ts`, `apps/fed/src/components/ShareModal.tsx`,
  `apps/fed/src/components/ShareLinks.tsx`, `apps/fed/eslint.config.mjs` (the single-entry-point rule),
  `apps/fed/e2e/analytics-events.spec.ts` (asserted on the built, prerendered site).
