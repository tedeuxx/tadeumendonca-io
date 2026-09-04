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

## Amendment (2026-09-04) — slice B shipped, and the other half of the schema is now immutable too

**This amendment RECORDS names that have shipped, and it carries THREE decisions that were not
pre-authorised by this record** — §2's share-deeplink exclusion, §4's once-per-session emission rule,
and §5's repair of the same rule in slice A's live article events. It decides nothing about a NAME,
which is the class this record governs; it is not decision-free, and an earlier draft of this sentence
claimed it was while §2 called itself *"a decision this record did not pre-authorise"* four paragraphs
below. The four events were fixed
by the intake that produced this record — which named `share_open`, `contact_reach` and
`outbound_click` outright and left `nav_click` open — and `nav_click` was settled by
**the owner's ruling on [#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597#issuecomment-5546459523)
(2026-09-04)**: *«Enviar nav_click»*, with `from`/`to`, **emitted at the click**. It is written here for
the reason the whole record exists — a shipped-but-unrecorded name is the one thing worse than a badly
chosen one, because nothing tells the next reader it is fixed. Implemented in
`product/instrument-funnel-slice-b-597`.

### The schema, as shipped

| event | parameters (beyond `locale`) | what it observes — and what it does not |
|---|---|---|
| `share_open` | `slug` | a share affordance was OPENED. Emitted by `ShareButton` — the modal trigger — and by nothing else, because nothing else on this site opens |
| `contact_reach` | — | the landing's `#contato` section INTERSECTED the viewport, **once per SESSION** (§4). **Never that it was read** — there is no dwell floor, deliberately |
| `outbound_click` | `href` (`hostname + pathname`) | a link took the reader off the site, by a route that is neither a contact channel nor a share destination |
| `nav_click` | `from`, `to` (both `NavArea`) | a nav control was clicked, with the ORIGIN captured at the click. **`from === to` is EMITTED, not suppressed** — it is a truthful row meaning *clicked a nav control pointing at the page I am already on*, which is real re-anchoring behaviour. Read the diagonal as expected, never as a defect; a transition analysis filters it in one clause, and suppression would have destroyed rows nothing could reconstruct |

### The five decisions inside the implementation, and each one is a trade

**1 · `from`/`to` are a CLOSED UNION, and it is the mechanism rather than a convention.** `NavArea` has
ten members — `home · articles · contact · portfolio · ramp-up · architecture · library · me · article
· other`. `to` is read from a literal in `AppShell`'s own nav table; `from` from `navArea()`, a total
function over a pathname whose residual is `other`. **A query string has no member of the type to
arrive as**, which is the same argument this record already made for `contact_click`'s closed `target`,
and it is why `path` staying off the spine is not quietly reintroduced under two new names.

*Two members are destination-only (`articles`, `contact` — the landing's anchors, indistinguishable as
an origin) and one is origin-only (`article` — the nav points at no article).* That is a property of
the site, not a gap. *Cost:* **a public route added without a row in `navArea.ts` reports as `other`
and nothing reddens.** The safe direction — under-attributed, never mis-attributed — and
`navArea.test.ts` cross-checks every route-typed nav entry's `area` literal against the classifier, so
the two mechanisms producing one vocabulary cannot drift silently.

**2 · `outbound_click` refuses two whole classes, and the second one is a decision this record did not
pre-authorise.** The five contact channels are refused because `contact_click` owns them — the intake
asked for that. **The three share deeplinks are refused too, and that was not asked for:** a share to
LinkedIn genuinely leaves the site, so an unconstrained rule would claim it. It is refused because
`share_complete` already measures that act with a better vocabulary, and because an `outbound_click`
series that is mostly share clicks cannot answer *where do readers leave to*, which is the only
question it exists for — **two populations under one name, which is the failure this record was written
to prevent.** *The counter-argument, recorded rather than dismissed:* a reader who clicks a share
deeplink DID leave the site, and that departure is now invisible to the outbound series. Accepted; it
is visible in `share_complete`.

**`href` HAS UNBOUNDED CARDINALITY, and that is accepted rather than unnoticed.** The set of outbound
destinations is open by construction, so the dimension has no ceiling — GA4 buckets the tail into
`(other)` once the daily-distinct limit is reached. It **degrades and does not corrupt**: the top
values keep resolving, and a narrower dimension can be added later without renaming anything, so
nothing about it is irreversible and this record's immutability thesis does not reach it. Written here
rather than left in a pull request, because a degradation axis documented where nobody re-reads it is
documented nowhere in six months.

**Both exclusions are a LOOKUP, not an ordering.** `useContactClicks` and `useOutboundClicks` are two
delegated listeners on the same shell node, so both see every click and the order they run in is a fact
about React effect registration — not something a measurement may depend on. The sets are derived from
`CONTACT_CHANNELS` and `SHARE_TARGETS` themselves, so a sixth channel or a fourth share target is
covered the day it is added. *One consequence, in the direction this record already chose:* the
contact exclusion is by **bounded form**, which is WIDER than `contact_click`'s own exact-href rule — so
a contact link written with a differently-spelled href is silent in **both** series rather than silent
in one and misreported in the other.

**3 · `share_open` is a denominator for the MODAL, not for the site.** The article footer's
`ShareLinks` block is always visible, so a reader reaches `share_complete` from it having opened
nothing — and slice A shipped `share_complete` with **no parameter naming its entry point**, a name that
is now immutable. **So the ratio can exceed 1, and a ratio above 1 is not a defect.** Read it as a floor
on modal abandonment, never as a completion rate. This is the sharpest limit slice B carries and it is
inherited from slice A rather than introduced here; closing it would mean a new event name, not a new
parameter on an old one.

`share_open` also **reuses the `slug` dimension** rather than registering a second one, so `slug` now
holds `architecture` and `ramp-up` alongside real article slugs. They stay separable because the EVENT
distinguishes them — no `article_progress` is ever emitted for a markdown page.

**4 · A ONE-SHOT EVENT IS ONE PER SESSION, and the code was moved to the record's promise rather than
the record retreated to the code.** Owner's ruling, 2026-09-04: *«Uma vez por sessão»*, with
`sessionStorage`.

*What was actually shipped first, and it is why this decision exists at all.* The one-shot lived in
`observer.disconnect()` **inside** the effect, so it was scoped to the OBSERVER. Any dependency change
tore the effect down and built a new `IntersectionObserver`, which delivers an initial callback for
whatever is already on screen — the shot was re-armed. Measured in a browser on the built site: a PT/EN
toggle with the section on screen produced two rows (`locale: en`, then `locale: pt`, `scrollY`
unchanged at 2967), and a consent re-grant produced **two identical rows with no dimension separating
them.** The published claim was *once per visit*; the behaviour was *once per observer*.

*Why the session and not the page view.* A funnel's numerator should be counted against the
denominator its stages are read against, so a per-page-view guard would answer a different question
under a name that can never be changed. ~~`contact_reach` answers *how many sessions reached
contact*~~ — **STRUCK by the second amendment below (2026-09-04): it does not, and `sessionStorage` is
why.** The guard is per-TAB and a GA4 session spans every tab, so the numerator and the denominator are
two different objects and the error runs in **both** directions. Read *What `sessionStorage` scopes to,
and what these events therefore count* before reading this series as sessions. The clause is struck
rather than deleted because it is the sentence that justified this mechanism over the two rejected
ones, and **that choice is unchanged** — what was wrong is only the claim about what it achieved.

The rejected option was a `useRef`: cheaper, fixes both measured paths, re-counts on navigate-away-and-back — and it would still
have required amending this table, which is paying an amendment to a public immutable schema to buy a
weaker guarantee.

*The cost, stated:* a reader who returns to the section later in the same session is not re-counted.
That is the correct direction for a funnel stage and the wrong one for a volume metric — **the guard is
not for an event that is meant to count occurrences.**

*The mechanism:* `lib/sessionOnce`, `sessionStorage`, one namespaced marker per event. It **fails
OPEN** — private mode makes the storage throw, and the chosen answer there is *emit* rather than
*suppress*, because a dropped funnel stage is invisible in the data while a duplicate row is not. And
the marker is written **only when the hit actually shipped**, so a reader who withdrew consent between
an observer's creation and its callback has not spent the session's shot.

**5 · THE SAME RULE IS APPLIED TO SLICE A's `article_progress` AND `article_end_reached`, WHICH HAVE
BEEN LIVE SINCE v1.1.81.** Not this branch's defect; repaired in this branch anyway. **Which means
both series have a SEAM: the same two names mean something different before and after 2026-09-04, and
readings that span that date are not comparable** — see *The seam of 2026-09-04, and why it is a whole
day rather than a minute* below for the window, the direction of the break, and what it does to a
chart.

Shipping the fix for the new event while knowingly leaving the identical root cause running would have made this
branch's own commits the record that the bug was known and left. **Both events carry it — checked, not
inferred from symmetry:** the milestones re-emit immediately on a rebuild; the terminal event needs a
second full dwell floor to elapse first, so it is slower and no less real, and the regression waits it
out rather than passing early against it.

*The one place the repair is NOT a copy of `contact_reach`'s: the marker is keyed on the article's
locale-independent KEY, never on its slug.* Slugs are per-locale (ADR-0037), so the toggle that
produces the duplicate also moves `my-commitment` to `meu-compromisso` — a slug-keyed guard would not
match, and the duplicate would hide under a second slug instead of being visible under one. **That is
strictly worse than the bug**, because the two rows stop looking like duplicates in any report. The key
is used for the marker only and is **never emitted**; `slug` remains exactly what GA4 receives.

*The cost, stated:* a reader who genuinely re-reads a piece — or reads both editions — in one session
is counted once. Same trade as §4, on the funnel that has the same shape, and it is the conservative
direction for a proxy that already errs toward over-counting.

*And a second-order effect worth writing down, because the repair could have introduced it:* the
milestone set is **seeded** from the session markers rather than merely consulted, since that set is
also the precondition the terminal event tests. A naive guard would have suppressed the duplicate and
made `article_end_reached` permanently ineligible after any rebuild — a silent loss, which is the worse
of the two errors.

### What the consent notice did NOT need, and why that was checked rather than assumed

**No copy changed.** All four events land under the three verbs the notice already names —
*read / shared / clicked* — and the notice is at its layout ceiling: `messages.ts` records that the
first draft of the slice-A wording grew the bar by one line and covered the article's own footer share
trigger, reddening `content.spec.ts`. **The bottom stack has no headroom at 1280px with both notices
open**, so that string is a constraint rather than slack. `contact_reach` is the only one where the
mapping is worth stating: reaching a section is *what gets read here*, which is the verb it falls under.

### The registration obligation, again, and it is still non-retroactive

**`href`, `from` and `to` must be registered as event-scoped custom dimensions BEFORE these events
collect.** `slug` and `locale` already exist from slice A. **Anything emitted before its dimension
exists is permanently unqueryable for that period** — registration does not backfill, and nothing in
this repository can observe whether it was done. That gap is unchanged by this amendment and unclosable
from here.

**`source_section` is named in this record's slice-A registration list and is emitted by NOTHING in
slice B.** The four events carry `slug`, `href`, `from` and `to`, and no event carries a section
identifier. Registering it costs nothing and protects a future slice; **its absence blocks none of the
four.** Said explicitly because the list above is the one a console action will be taken from, and a
dimension listed as owed for an event that does not emit it is how a registration list stops being
trustworthy.

## Amendment (2026-09-04, second) — two limits that already existed, one stated wrongly and one not stated at all

**This amendment decides NOTHING. It changes no name, no parameter, no emission rule and no line of
code.** The behaviour the first amendment describes is correct and shipped; what was wrong is what §4
and §5 claim *about* it. Both were found by `quality-assurance` on
[PR #602](https://github.com/tedeuxx/tadeumendonca-io/pull/602#issuecomment-5547215872) (round 2) and
**handed up rather than blocked**, on the explicit ground that the residual belongs to the mechanism
the owner named (*«Uma vez por sessão»*, `sessionStorage`) and that a gate blocking on the consequence
of a fresh ruling is re-opening it. That reading is correct and this record does not re-open it either:
**nothing below proposes changing the mechanism.**

Written by `tech-lead`, who holds this record. It is an amendment rather than a new record because it
adds no decision — the ADR practice's convention is that **a live record is amended by APPENDING and
struck in place, never rewritten**, and both §4's clause and this section are exactly that. *(That
convention is methodology, so it lives in the plugin's own library and is deliberately NOT cited here
by number: `0020` in **this** library is the SonarCloud quality gate, and a cross-library number is a
citation that resolves to the wrong record. This parenthesis exists because the first draft of this
paragraph did exactly that.)*

**Why it is in the record at all, rather than in a comment.** This record's own thesis is that a GA4
event schema cannot be repaired once it collects, so **the record is the mitigation**. A number whose
*meaning* changed on a known date, and a series that does not count what its own record says it counts,
are the two cases that thesis exists for: no code change reaches the rows already collected, and the
only thing that can protect the analyst who reads them is a sentence they can find.

### What `sessionStorage` scopes to, and what these events therefore count

**`sessionStorage` is scoped to an (origin, tab) pair — never to a GA4 session.** It survives a reload
and same-tab navigation, dies when the tab closes, is copied into a duplicated tab by Chromium and
Firefox, and is **never shared between two tabs**. A GA4 session is scoped to the *client* — one store
per browser, shared by every tab — and ends after a period of inactivity, 30 minutes by default and
configurable per property; **nothing in this repository can read what this property is set to**, so
even the timeout is a documented default rather than a measured fact here.

**Neither object contains the other, so the error runs in both directions:**

| case | rows | GA4 sessions | direction |
|---|---|---|---|
| one reader, **two tabs**, one session | 2 | 1 | **over-count** |
| one reader, **one tab left open** across a >30-minute gap, then scrolls back | 1 | 2 | **under-count** |

The verdict that raised this named the first. **The second is its mirror and is at least as likely on
this site** — a tab held open on an article overnight is ordinary reader behaviour, and the marker
outlives the session boundary silently. Naming only the over-count would have left the record wrong in
the *reassuring* direction, which is the half of a stale claim that misleads.

**Why `sessionStorage` was still the right choice, and it was not chosen by default.** Four options
were available and the other three are worse in ways that are not recoverable once a name has
collected:

- **`useRef`** — per page view. Re-counts on every full document load, so a reader who navigates away
  and back is counted twice. Fixes both paths that were measured and none of the ones that were not,
  and it would have required amending this table anyway — paying an amendment to an immutable schema
  to buy a weaker guarantee.
- **`localStorage`** — once per **browser, forever**. A funnel stage that can fire once in a reader's
  lifetime is not a funnel stage, and it is durable client state that would outlive a consent
  withdrawal — the one property a site whose stated posture is *nothing third-party until asked*
  cannot afford, however non-identifying the value.
- **Reading GA4's own session boundary client-side** — its cookie, or re-implementing the inactivity
  timeout. This is the only option that would make the numerator and the denominator the same object,
  and it is refused: it makes the client a second source of truth for session identity, it re-derives
  a vendor's internals that can change under us without a deploy, and it reads a cookie this record's
  consent gate is built to keep out of the decision path.
- **`sessionStorage`** — the closest available approximation to a *visit*, with no identifier, no PII,
  no new consent surface, and state that dies with the tab. **Chosen**, and still the right call
  against the three above.

**So, precisely: the number is a count of TAB-VISITS in which the event's condition was met at least
once, among consenting readers. It is not a count of GA4 sessions.** Read the series as sessions
carrying a bounded over-count in the multi-tab case and a bounded under-count in the long-lived-tab
case — never as an exact session count, and never as a per-reader count. **Neither error is measurable
from here or from GA4**: nothing in this repository can observe a reader's tab count and GA4 exposes no
tab dimension, so the size of the gap is unknown rather than small-and-known. What can be said about
its size is only structural — both cases require one reader to do something unusual with tabs, and
neither can be corrected retroactively.

**This applies to every event guarded by `lib/sessionOnce`, not only `contact_reach`** — from v1.1.82
that is `contact_reach`, `article_progress` and `article_end_reached`. §5's *cost, stated* paragraph
should be read with this section beside it.

### The seam of 2026-09-04, and why it is a whole day rather than a minute

**`article_progress` and `article_end_reached` were already collecting when §5 changed what they
count.** They shipped under the OLD per-observer behaviour and ran that way in production before the
guard reached them:

```
git log -1 --format='%cI %s' 0df5481   # slice A merged, old behaviour live
  -> 2026-09-04T17:52:07-03:00  Merge pull request #601 …slice-a-597
git log -1 --format='%cI %s' c50fef8   # slice B merged, guard live
  -> 2026-09-04T19:35:11-03:00  Merge pull request #602 …slice-b-597
git tag --contains 44c5d86             # earliest release carrying the two events
  -> v1.1.81
  -> v1.1.82
```

**One hour and forty-three minutes on 2026-09-04, and the two names mean different things on either
side of it.** Before: **once per observer** — every effect rebuild (a locale toggle, a consent
re-grant) constructed a new `IntersectionObserver`, which delivers an initial callback for whatever is
already on screen, and the shot was re-armed. After: **once per session per article**, per the guard.

**The direction of the break, which is the part a chart hides.** The old behaviour **over-counts**
relative to the new one, so across the seam the series can only fall for readers who triggered a
rebuild. **A drop on 2026-09-04 is an artifact of a deploy, not a change in reader behaviour.** The
magnitude is bounded below by zero and above by the number of effect rebuilds in that window, and
**nothing recorded that number** — no dimension separated a re-armed row from a first one, which is the
whole reason the defect was invisible in the data.

**The boundary is a DAY, not a timestamp, and treating it as a timestamp is the second way to get this
wrong.** Merge is deploy here, the deploy takes minutes to reach the edge, and a reader already holding
the old bundle in an open tab keeps emitting the old behaviour until they load again. Both edges are
therefore soft in the direction of *more contamination*, not less.

> **The rule: any reading of `article_progress` or `article_end_reached` that spans 2026-09-04 is not
> comparable.** Compare whole days strictly before against whole days strictly after, discard the seam
> day, and say so in the chart's own caption — or do not draw the chart.

**`contact_reach` has NO seam, and that is worth stating so nobody carries this caveat across.** It
shipped in v1.1.82 with the guard already in place (`git tag --contains e29252a` → `v1.1.82` alone), so
it never collected a row under the old behaviour. Its limit is the one in the section above and only
that one.

### Why every figure in this amendment carries its command

The two windows above are this amendment's only numbers, and each ships with a command that produced
it, runnable at any head. That is not house style here; it is a response to a measured failure rate.

**This workstream published three wrong figures on 2026-09-04** — a stale mutation count, a corrected
count carrying the wrong file list, and slice B's commit message attributing a branch-coverage dip to
the wrong file — **and all three have one shape: the number came from the run and the sentence around
it came from memory.** The verdict that produced this amendment contains a fourth of the same shape:
its ask described the two article events as carrying *weeks* of rows, where the window measured above
is **1 h 43 min**. Right in direction, wrong in magnitude by three orders, and it does not change the
ask — a seam is a seam at any width — which is exactly why a plausible number survives review. **A
figure in this record is stated as a command or it is not stated.**

**What this section deliberately does NOT absorb: slice B's coverage attribution.** The commit message
and PR body of `863a3b5`/#602 credit the 94.5 → 94.42 branch dip to `sessionOnce.ts`'s two fail-open
`catch` arms; the gate measured that file at 100 % branches and showed that *removing* it lowers the
aggregate, the real cause being two defensively-unreachable fallback arms elsewhere. **That correction
does not belong in this record.** It is a fact about a test suite, not about a GA4 schema, and a
decision record that accumulates corrections to whatever was wrong in the MR that carried it stops
being a record of decisions — which is the failure the significance gate in
`documentation-standard` exists to prevent. Its home is the artifact that carries the false
sentence, and the correction already exists durably and publicly in the round-2 verdict linked at the
top of this amendment.

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
