# 0033. GA4, consent-gated — a hard opt-in gate, not Consent Mode v2

- **Status:** accepted · **amended 2026-09-04** (the implementation grows an event schema —
  [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md) — and the withdrawal consequence
  below is **discharged**: emission is now gated on the reader's current choice, so `gtag` staying
  injected no longer means the reader keeps being reported)
- **Date:** 2026-07-24
- **Deciders:** the owner
- **Driven by:** [ADR-0023](./0023-observability-static-site.md) (which chose "GA" as the analytics tool in
  the abstract) · refines it with the concrete tool, load model and consent gate.
- **Shares a property with:** [ADR-0002](./0002-fully-static-spa-no-backend.md) — "nothing third-party
  until the reader asks" (the VideoEmbed facade).

## Context & problem
ADR-0023 named **Google Analytics** as the usage-observability tool for the static site, but abstractly —
it did not fix *which* GA, *how* the tag is loaded, or *whether/how* the reader consents. Those are the
load-bearing sub-decisions, and they carry weight beyond telemetry: this is a **proof-of-engineering** site
whose argument is restraint (the ramp-up page, the YouTube-facade `VideoEmbed` that loads nothing until the
reader clicks). Putting a Google, cookie-setting tracker on that site is in visible tension with the pitch,
so *how* it is done is itself an architectural decision, not a config detail.

Two questions had to be answered honestly:
1. **Which tracker** — a full-featured Google product, or a cookieless privacy tracker that would fit the
   positioning and need no banner at all?
2. **What consent model** — no gate, Google's Consent Mode v2, or a hard opt-in gate that loads nothing
   until an explicit Accept?

## Decision drivers
- The owner wants **rich behavioral data** (funnels, retention, cross-page paths, audience) to see how the
  proof-of-engineering surfaces are actually used — not just hit counts.
- The site argues for **restraint**; whatever ships must not quietly contradict that argument.
- The consent surface must be **valid in every geography** without geo-detection branching — the strictest
  opt-in applied globally, not "a banner only where the law forces one."
- Low cost / no infra (ADR-0023, ADR-0001): the tracker must stay client-side, scale-to-zero.

## Considered options

### Tracker
1. **GA4** (chosen) — measurement id `G-5W9EQN303X`. Richest data, free, the tool the owner already knows.
   *Trade-off:* it is a Google, cookie-setting third party; it **needs** a consent banner and it sits in
   standing tension with the site's restraint argument.
2. **A cookieless tracker (Plausible / Umami / GoatCounter)** — *Why not chosen:* it would fit the
   positioning better, set no cookie, and need **no banner at all**, but it yields materially thinner data
   (no cross-session identity, no funnels/retention/audiences). The owner weighed this squarely and chose
   the data over the tighter positioning fit. **This is the crux the owner accepted**, recorded in full
   below — it is not a default, it is a deliberate trade against the grain of the pitch.

### Consent model (given GA4)
1. **Hard opt-in gate** (chosen) — `gtag.js` is injected **only after an explicit Accept**. Before a choice,
   on Decline, and when unconfigured, the script is never added, no cookie is ever set, and **no request
   ever reaches Google**. This is the exact "nothing third-party until the reader asks" property of
   ADR-0002's VideoEmbed facade, applied to analytics.
2. **Google Consent Mode v2** — *Why not:* it loads `gtag.js` immediately and **pings Google with a denied
   signal before the reader has chosen**. That contradicts the restraint argument at the wire level — the
   reader's browser has already talked to Google before consenting. Rejected deliberately.
3. **No gate (load GA on every visit)** — *Why not:* sets a Google cookie and phones home unconditionally;
   indefensible on a site whose thesis is restraint, and not valid opt-in in stricter geographies.

### Where the banner is shown
- **To everyone, no geo-detection** (chosen) — the strictest opt-in applied globally, so the same surface
  is valid in every geography (the owner's explicit requirement). Accept and Decline carry **equal weight**
  (no pre-tick, no buried Decline, no dark pattern). Withdrawal/redecision is a **footer control as
  reachable as granting** was (`lib/consent` `reopen` → clears the stored choice, re-shows the banner).
- *Rejected:* geo-gated banner (show only where legally forced) — cheaper data elsewhere, but it makes the
  consent posture a legal-minimum rather than a stated value, and adds geo-branching for no product gain.

## Decision outcome
Chosen: **GA4 (`G-5W9EQN303X`), loaded behind a hard opt-in consent gate, shown to everyone with
Accept/Decline of equal weight and a footer withdrawal control.** Consent Mode v2 is explicitly **not**
used. Analytics is fully **inert when `VITE_GA_MEASUREMENT_ID` is unset**, so `vite preview`, the build-time
prerender and the E2E run never emit a hit; production sets the id in the deploy workflow.

Implementation: `apps/fed/src/lib/analytics.ts` (the inert-until-Accept loader, the consent gate every
emission passes, and the custom event schema — *this read "the inert-until-Accept loader + `page_view`
tracking" until 2026-09-04, when the schema of
[ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md) landed in the same module; corrected
rather than struck, per this library's rule for a reference whose only job is to point*),
`apps/fed/src/lib/consent.tsx` (the shared grant/withdraw provider), and
`apps/fed/src/components/ConsentBanner.tsx` (the equal-weight, geo-neutral banner).

## Consequences
**Good**
- The restraint argument holds **at the wire level**: a reader who Declines or ignores the banner has had
  zero contact with Google — the same guarantee the VideoEmbed facade makes for embeds (ADR-0002).
- Consent is **valid in every geography** with no geo-detection code path; one surface, one behavior.
- Withdrawal is a first-class action, as reachable as granting — the consent model is a stated value, not a
  legal-minimum checkbox.

**Bad / accepted costs**
- **Thinner data than an unconsented tracker.** Many readers will Decline or never choose → GA sees only the
  granting subset. This **compounds ADR-0023's existing ad-blocker caveat**: usage numbers were already a
  floor, and the consent gate lowers that floor further. The floor is not exact and now less exact.
- **A standing Google client-side dependency** on a site that argues for restraint. A cookieless tracker
  would have avoided both the dependency and the banner entirely.
- **The positioning tension is a standing cost, not a one-time one** — every visitor meets a Google cookie
  banner on the proof-of-engineering site. The hard gate mitigates the tension but does not remove it; it is
  the price of the richer data, accepted with eyes open.
- ~~A returning reader who withdraws consent keeps `gtag` loaded for the remainder of that session (it
  cannot be un-injected); their new choice governs the next full load.~~ **→ discharged 2026-09-04 by
  [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md).** The sentence was true of the
  **injection** and was silently read as true of the **emission**: `gtag` still cannot be un-injected,
  but every emission now re-reads the stored choice, so a reader who withdraws goes **silent
  immediately** rather than at the next full load. See the amendment below for what that cost while it
  stood.

## Links
- Refines [ADR-0023](./0023-observability-static-site.md) (GA as the observability tool) · shares the
  "nothing third-party until the reader asks" property with [ADR-0002](./0002-fully-static-spa-no-backend.md)
  (VideoEmbed facade) · inertness supports the ADR-0004 build-time prerender staying hit-free.
- Implemented on branch `feat/ga4-consent-banner`
  (`apps/fed/src/lib/analytics.ts`, `apps/fed/src/lib/consent.tsx`,
  `apps/fed/src/components/ConsentBanner.tsx`).
- **Refined 2026-09-04 by [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md)** — the event
  schema this gate now governs, and the repair recorded in the amendment below.

## Amendment (2026-09-04) — the gate becomes real at the emission, and the implementation grows a schema

**Nothing decided here is reversed.** The tracker is still GA4, the model is still a hard opt-in gate,
Consent Mode v2 is still refused, and the banner is still shown to everyone with equal-weight choices.
What changed is that **this record's own guarantee was weaker in the code than on the page**, and
[#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597) made the gap expensive enough to close.

**The defect, in one line.** The guard was `injected` — a question about the **script** — where the
question that matters is about the **reader**. `reopen()` clears the stored choice and returns the status
to undecided **while `injected` stays true**, so a reader who withdrew consent kept being reported for
the remainder of the session. This record's *"it cannot be un-injected"* consequence is exactly that
belief written down: true of the injection, and read as true of the emission by everyone including the
code. **It was live in production from this record's own deploy until 2026-09-04.**

**What it cost while it stood, and what it was about to cost.** Page_views from a withdrawn reader —
a real breach of the consent posture, and a small one in substance. With the event schema of
[ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md) it would have cost `contact_click`: **a
reader who withdrew consent and then clicked through to LinkedIn would still have been reported**, which
is the one thing the site's consent copy promises does not happen. Repairing the gate *while* widening
what is collected is the order of operations this amendment wants on the record.

**The repair.** Every emission passes one gate that is deliberately two conditions — the script is
loaded **and** `readConsent() === 'granted'`, read per call rather than cached, because the withdrawal
happens in another component in the same session with no event the analytics module subscribes to.
**Mutation-checked against the source rather than read:** removing the consent condition from `mayEmit`
reddens six assertions across four files, covering the granted / never-granted / withdrawn-after-granted
set. **The property moves from *cannot be un-injected* to *loaded but silent*** — which is what this
record's hard gate always implied.

**One consequence of this record is strengthened rather than weakened by that.** *"Thinner data than an
unconsented tracker … usage numbers were already a floor, and the consent gate lowers that floor
further"* — the floor is now genuinely lower, because a withdrawn reader disappears at the moment of
withdrawal instead of at the end of their session. That is the correct direction, and a drop in the
numbers after this deploy should not be read as a regression.

**What this amendment does NOT do.** It does not record the event schema — that is
[ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md)'s, one decision per record, and this one
would otherwise acquire a second subject it never decided. It does not touch the banner, the geo-neutral
posture or the withdrawal control. And it adds **no** claim about the reader: the consent surface's own
wording was widened in the same MR to match what is now measured, because scroll depth is reading and
contact clicks are not, and a privacy claim that undersells what is collected is still a false one.
