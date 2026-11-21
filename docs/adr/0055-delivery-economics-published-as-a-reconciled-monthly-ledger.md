# 0055. Delivery economics — the AI subscriptions behind the harness, published as a reconciled monthly ledger with every unknown labelled

- **Status:** proposed (awaiting the owner's ratification; the scope it records is his rulings on Issue
  [#691](https://github.com/tedeuxx/tadeumendonca-io/issues/691), 2026-11-20)
- **Capability:** `delivery-economics`
- **Date:** 2026-11-21
- **Deciders:** **the owner** — *"Spend + coverage"* and *"#691 = S1, open S2 and S3"*, each a comment on
  #691, under his superseding framing *Human+AI Delivery Economics* on the same Issue. The mechanism is
  `tech-lead`'s intake on #691, and the placement within `/architecture` is `product-lead`'s; written by
  `developer` in the implementing merge request.
- **Supersedes / superseded by:** —
- **Driven by:** [#691](https://github.com/tedeuxx/tadeumendonca-io/issues/691) (S1) · neighbours
  [#823](https://github.com/tedeuxx/tadeumendonca-io/issues/823) (S2, allocation) and
  [#824](https://github.com/tedeuxx/tadeumendonca-io/issues/824) (S3, the remaining axes), each of which
  amends this record in its own merge request · **reads, never changes**
  [ADR-0002](./0002-fully-static-spa-no-backend.md) (nothing fetched at build or at runtime) and
  [ADR-0013, *The minimal infrastructure security posture*](./0013-s3-cloudfront-hosting.md#the-minimal-infrastructure-security-posture) (no `iac/` change)

## Context & problem

The site already publishes what it costs to **run** (`/architecture`, the monthly hosting bill), and that
section says in its own words that the AI subscriptions are paid and stay outside that total. The harness
that builds the site runs on them. #691 asks for the other half: a bilingual monthly view of what was paid
for the maintained AI subscriptions, how much harness activity was observed, and how that fixed expense was
allocated across public work, under the owner's framing that the subject is the **delivery system** (owner,
harness, models and subscriptions together), never a score of the human, a labour record or a model
leaderboard.

It crosses the significance bar on three arms. **It publishes financial facts**, which is why the Issue is
boundary class. **It is a public data contract**: a versioned snapshot schema that later periods and two
neighbouring slices extend. **It is a methodology a reader will reuse or misread**: the readings it refuses
(a price per token, a utilisation percentage, a single composite) are the readings a reader reaches for by
default.

## Decision drivers

- **Unknown is never zero.** A missing measurement rendered as `0` is the one defect that turns an honest
  page into a false one, and it reads as complete.
- **Nothing private enters the public artifact**: no receipt, invoice, account, session or payment
  identifier, no prompt, transcript or response, no machine-local path, no branch, no private repository and
  no employer or client context.
- **No credential anywhere in the path.** The consumer subscriptions expose no billing interface an agent can
  read without the owner's own credentials (a premise, unmeasured), so the spend has to come from him.
- **A measured number ships with the command that produced it** (the repository brief, floor rule 13).
- **The build reads only what is committed** ([ADR-0002](./0002-fully-static-spa-no-backend.md)).
- **One instrument per period.** The owner ruled out a backfill from the retired dispatch-metrics comments,
  which carry session and branch identifiers and would mix two instruments in one period.
- **Lean** ([ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through)):
  no new dependency, no network call, no infrastructure.

## Considered options

1. **A committed monthly snapshot, produced offline on the owner's machine from two public inputs, rendered
   as a section of `/architecture` with every unknown labelled (chosen).** *Trade-off:* the first period
   carries almost no observed consumption, so the section mostly shows what is not yet known.
2. **Backfill October from the earlier dispatch-metrics comments.** *Rejected (owner):* two instruments in
   one period, Codex unmeasured, and identifiers to strip at the privacy boundary.
3. **Ship the mechanism behind tests and publish nothing until a covered period closes.** *Rejected (owner):*
   nothing reader-facing this sprint, and the same weak first baseline a month later.
4. **A route of its own, off the menu, on the `/analytics` pattern.** *Rejected (owner, on product-lead's
   placement):* a section inside `/architecture` adds no URL pair to pin, and the page already carries the
   hosting half of the same question.
5. **Read the spend from a billing console or an invoice.** *Rejected:* it needs a credential and puts an
   invoice, an account identifier or both one step from the public artifact.
6. **A price per token** (the attested amount divided by observed tokens) **or a utilisation percentage**
   (paid divided by consumed). *Rejected:* a fixed subscription has no marginal price, and an allowance the
   provider does not report cannot be shown as used. The quotient is an allocation rate inside this dataset
   and is never published as a price.
7. **A single composite score over the axes.** *Rejected:* it ranks by construction and hides which axis
   moved. Any later composite and its weights need a new owner decision or an amendment here.
8. **Store each axis's state in the snapshot.** *Rejected:* a stored state is a second statement of what the
   numbers already say and can disagree with them; the state is derived from the snapshot instead.
9. **A schema-validation library.** *Rejected:* a new dependency class for one contract. The validator is
   hand-written, and the producer's test runs it over the producer's own output.

### The two limbs of the entry rule, applied

[ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md)'s rule:

- **Capability limb.** No capability in the partition covers publishing financial facts or an accounting
  method. `harness-self-description` ([ADR-0043](./0043-harness-inventory-derived-from-plugin-repo.md)) covers
  the derived inventory of the harness and is alone on purpose; `publication-and-distribution` covers how a
  page reaches readers. So this record anchors a new row, `delivery-economics`, which #823 and #824 amend.
- **Re-decision limb, per rejected option.** Options 6 and 8 are refused by a mechanism:
  `economicsSchema.ts` has no field for a rate or a stored axis state and refuses an unknown key, and the
  section's test refuses the rejected vocabulary in both catalogs. Option 1's two invariants are refused the
  same way (a `0` standing for unknown, and a sum that does not reconcile). Options 2, 3, 4, 5, 7 and 9 are
  refused by **nothing**: a later slice could backfill, move the section or add a dependency with every check
  green. So the record is owed for those.

## Decision outcome

**Chosen: option 1.** Concretely, as built for #691:

- **The snapshot** is one file per calendar month,
  `apps/fed/src/content/generated/economics/<YYYY-MM>.json`, schema version 1, method version 1.0.0. It holds
  the period, `as_of` (the export's cut-off date), the coverage source, and one card per provider in a fixed
  order: Anthropic, OpenAI, Kiro. **Every provider is always present**, so an absent one cannot read as zero.
- **The validator** is `apps/fed/src/data/economicsSchema.ts`, and the typed loader `economics.ts` runs it
  at module load, so an inadmissible snapshot fails the build and the prerender. It refuses: an unknown key at
  any level; a string carrying a machine-local path or a private directory name; an Issue or repository
  outside the allowlist (`tedeuxx/tadeumendonca-io`, `tedeuxx/mhw`); a run count that does not add up; a
  metric sum that is not `null` exactly when no run reported it; a metric that is not the provider's own
  native unit; and money that does not reconcile.
- **The reconciliation**, per provider, in integer minor units: `allocated + shared/unallocated + rounding ==
  paid`. Method 1.0.0 allocates nothing to features (that is #823), so allocation is `not-estimable`,
  `allocated` is `null`, and the whole attested amount is shared/unallocated with zero rounding. No field sums
  native units across providers and no field combines currencies; there is no FX policy in version 1.
- **Spend has three states**: `owner-attested` (amount, currency, plan, billing period and the comment URL),
  `pending-attestation` (everything `null`), and `no-subscription` (no amount, the comment URL kept). It
  enters only through **the owner's own comment on #691** carrying one fixed block, below. Only a comment he
  authored counts; the latest one for the period wins, because a correction is a new comment; an **edited**
  one is refused, because the cited URL would then point at text the snapshot was not built from.

  ````
  <!-- spend-attestation:v1 -->
  ```json
  {"period": "2026-10", "entries": [
    {"provider": "anthropic", "status": "paid", "plan": "<product name>", "basis": "subscription",
     "billing_period": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}, "amount": "0.00", "currency": "USD"},
    {"provider": "kiro", "status": "no-subscription"}]}
  ```
  ````

  `amount` is a decimal string with exactly the currency's minor digits, converted to an integer without
  floating point; a provider left out of the block stays pending. The billing period is the provider's own
  cycle and must overlap the calendar month; it is shown beside the amount, because it need not equal it.
- **Consumption** is the worklog's `usage` object (tedeuxx/mhw#76) on events posted to public Issues, read
  through a `worklog.py export` composed from `gh issue view <n> --json url,comments` captures of every Issue
  in the allowlisted repositories updated on or after the period's first day. A run counts in the period when
  one of its events falls inside it; its provider follows its declared harness. Coverage uses the worklog's
  vocabulary per provider: runs, native, unavailable, unrecorded, Issues, and `complete`, `partial` or `none`.
  The regime is the `model`/`effort` pairs the usage records declare, counted per pair. The producer refuses
  a correction event inside the period and a run with two usage records, as the worklog report does, rather
  than guessing how to combine them.
- **The export's refusals are published, not hidden.** The worklog contract refuses a capture whose comments
  carry an event naming another Issue, which is what an Issue transferred between repositories looks like.
  Such a capture is left out of the export and listed in the snapshot's `issues_refused`, so the denominator
  is visible and a reader can open each one.
- **The producer** is `apps/fed/scripts/economics-source.mjs` (every decision) behind
  `apps/fed/scripts/gen-economics.mjs` (read two files, write one), run by hand as
  `npm --prefix apps/fed run gen-economics -- --period <YYYY-MM> --export <file> --attestation <file> --refused <refs>`.
  The build and CI never run it. **Its output is constructed from a closed key set, never copied**, so run
  ids, branches, evidence text and comment bodies are read only as far as a count needs them. It writes the
  same bytes for the same inputs, and **it refuses to overwrite a final period** (one with no provider
  pending): a published period is immutable, so there is no drift check to run.
- **The section** is the ` ```delivery-economics ` fence in both editions of `/architecture`, rendered by
  `DeliveryEconomics.tsx`. It opens with the period, `as_of` and the coverage, with the producer command
  shown verbatim, before any provider's spend. Each provider card shows spend, observed consumption, regime,
  allocated cost, shared/unallocated and entitlement utilisation, which is always *unavailable*. Every
  displayed word is in the locale catalog's `economics` group; identifiers (model, effort, plan, command,
  Issue references) render verbatim as code.
- **The fourteen axes** of the owner's framing are listed in his order, each with a state **derived** from the
  snapshot (option 8): `measured`, `partial`, `not-measured`, `pending`, `not-estimable` or
  `not-yet-instrumented`. In method 1.0.0 throughput, labour intensity, the two intensities, flow time,
  quality yield and delivery mix are not yet instrumented; allocated cost is not estimable (#823); baseline
  change and movement are not estimable, because **one period is a baseline**; consumption and regime follow
  the coverage; measurement coverage is always measured; shared/unallocated is pending until every provider
  is attested.
- **Comparability.** No trend, chart or movement before three comparable complete periods; conflicting axes
  render `mixed` once movement exists. Story points stay planned-scope weights and never a value; a frozen
  `planned_value` field is required before any claim of business value. Quality and reopen treatment is
  #824's to amend in.

## Consequences

**Good**
- A reader can tell paid, observed and allocated apart, and sees the size of the unknown before the size of
  the bill.
- The snapshot cannot carry a field nobody decided to publish, a zero that means unknown, or money that does
  not add up, without the build going red.
- No credential, no network call at build or at runtime, no new dependency and no `iac/` change.

**Bad / accepted costs**
- **The first period is almost entirely unknown.** October 2026 has four recorded runs and none reported
  usage, so consumption is not measured; the page says so. That is the accepted cost of unknown coverage, and
  it is permanent for that period.
- **The spend is as good as the owner's attestation.** Nothing checks the amount against an invoice; the
  evidence is his public comment and its date.
- **The capture set is a declaration.** `pagination_complete` is `false` for every repository, because a
  capture cannot show it held every comment, and an Issue last updated before the period's first day is not
  captured (it cannot hold an event inside the period unless its comments were backdated).
- **A refused capture is out of the count** until the worklog contract handles transferred Issues; the list
  is published, and the upstream fix is a `loop` item in the workstation repository, not this record's.
- **The vocabulary check covers words, not meaning.** A sentence that implies a price without naming one is
  held by review alone.
- **The producer reproduces the worklog's run logic in JavaScript**, so a change to that contract can leave
  the two disagreeing with every check here green.
- **An attested amount stays public forever** once the merge deploys; a mistake is corrected by a new
  attestation and a re-run while the period is not final, and by an amendment here after.

## Links

- Issue [#691](https://github.com/tedeuxx/tadeumendonca-io/issues/691) — the ask, the intake and the rulings ·
  [#823](https://github.com/tedeuxx/tadeumendonca-io/issues/823) (S2) ·
  [#824](https://github.com/tedeuxx/tadeumendonca-io/issues/824) (S3).
- [tedeuxx/mhw#76](https://github.com/tedeuxx/mhw/issues/76) — the worklog `usage` object, the only
  consumption instrument.
- [ADR-0002](./0002-fully-static-spa-no-backend.md) — the build reads only what is committed; not amended.
- [ADR-0043](./0043-harness-inventory-derived-from-plugin-repo.md) — the committed-generated-artifact shape
  this follows; not amended.
- [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md) — the
  entry rule, applied above.
- Implementation: `apps/fed/src/data/economicsSchema.ts`, `apps/fed/src/data/economics.ts`,
  `apps/fed/scripts/economics-source.mjs`, `apps/fed/scripts/gen-economics.mjs`,
  `apps/fed/src/content/generated/economics/2026-10.json`, `apps/fed/src/components/DeliveryEconomics.tsx`,
  `apps/fed/src/content/architecture.en.md` and `apps/fed/src/content/architecture.pt.md`,
  `apps/fed/src/i18n/messages.ts`, `apps/fed/e2e/delivery-economics.spec.ts`.
