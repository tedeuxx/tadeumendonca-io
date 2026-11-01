# 0054. The analytics schema page — a published description of the event schema, derived from the emitting code, carrying no figure, served off the menu

- **Status:** accepted (each of its three shapes is the owner's ruling on Issue
  [#640](https://github.com/tedeuxx/tadeumendonca-io/issues/640), 2026-10-31)
- **Capability:** `publication-and-distribution`
- **Date:** 2026-11-01
- **Deciders:** **the owner** — *«Página de esquema»*, *«Rota»* and *«Rota fora do menu»*, each a comment
  on #640. Written by `tech-lead` in the implementing merge request
  ([PR #797](https://github.com/tedeuxx/tadeumendonca-io/pull/797)); the record was flagged as owed at
  intake.
- **Supersedes / superseded by:** —
- **Driven by:** [#640](https://github.com/tedeuxx/tadeumendonca-io/issues/640) · **amends**
  [ADR-0023](./0023-observability-static-site.md) (see its 2026-11-01 amendment) · **reads, never
  changes** [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md) · **qualifies**
  [ADR-0045](./0045-document-title-leads-with-section-label.md) for an off-menu section (see its
  2026-11-01 amendment)

## Context & problem

The owner's ask, 2026-09-11, quoted from #640:

> «as metricas do nosso GA poderiam virar uma sessao do site Analytics. assim demonstro minha competencia
> e consigo ler as metricas de uma forma mais agradavel para meu proprio entendimento. Agrego meu tom
> critico sobre como eu gosto de acompanhar analytics de plataformas digitais.»

The site already measures itself: GA4 behind a hard consent gate
([ADR-0033](./0033-ga4-consent-gated-analytics.md)), a custom event schema that is immutable once it
collects ([ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md)), and a scope for
observability on a site with no server ([ADR-0023](./0023-observability-static-site.md)). None of that
was published. The question #640 answers is **what the site says in public about its own measurement**,
and in what form.

It crosses the significance bar on two arms. **A public contract:** a new permanent URL pair, one per
locale, whose title and OG card are pinned by the first scraper to fetch it
([ADR-0041](./0041-per-article-og-cards.md), [ADR-0005](./0005-og-coverage-every-public-url.md)).
**A cross-cutting pattern:** the first public route that is **not** in the menu, so the first one whose
menu clicks report `from: 'other'` in the `nav_click` event, and the first page whose content is a
description of code checked against that code.

## Decision drivers

- **Nothing on the page can be a figure a reader cannot check.** A GA4 number on a static page is
  unfalsifiable from outside, stale from the moment it is built, and needs a credential somewhere.
- **The description must not drift from the code.** A hand-typed list of facts about the repository is
  the failure `architecture-counts.test.ts` exists for: a count on `/architecture` that was true the
  morning it was written and false the same evening.
- **The schema is immutable once shipped** ([ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md)),
  and so is the `NavArea` vocabulary it carries. A page about the schema reads it; it must not spend it.
- **Emitted is not queryable.** What the browser sends is known to this repository; what GA4 can segment
  by depends on custom-dimension registration, which ADR-0051 places outside every gate. The page can
  state the first and must not claim the second.
- **Lean** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)): no new dependency, no network
  call, no credential.
- **Two editions, always** ([ADR-0032](./0032-i18n-locale-layer-english-baseline.md),
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)).

## Considered options

1. **A schema page, derived from the emitting code and checked against it, served as an off-menu route
   (chosen).** It describes each event the browser emits, its parameters, what it can establish and what
   it cannot. *Trade-off:* it shows the reader no number at all, so it argues a measurement posture
   rather than demonstrating results; and the check covers names, not the prose about each event.
2. **A numbers page — GA4 figures rendered on the site.** *Rejected (owner, decision 1):* every figure
   is unfalsifiable by a reader, stale between builds, and needs a GA4 credential either in the build
   (a pipeline secret and a network-sourced generator) or in the browser. It is also the variant the
   2026-09-11 intake read as boundary class. If wanted later it is a separate item; none is open.
3. **The same page as a menu item now — an eleventh `NavArea` member.** *Rejected (owner, decision 3):*
   ADR-0051 makes that vocabulary immutable once it collects, so adding a member is a permanent spend,
   made on day one with no history behind it. Promotion stays available as its own later decision.
4. **An article as the first shape.** *Rejected (owner, decision 2):* an article is the owner's voice
   in the `content` lane, and it is dated; a description of a schema has to track the code, which a
   dated piece does not. An article presenting the page may follow as a `content` item of his choosing.
5. **The page as hand-typed prose with no binding to the code.** *Rejected:* it is the drift failure
   named in the drivers, with more rows.

### The two limbs of the proposed entry rule, applied

[ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md) is
`proposed`, so it does not bind this record; it is applied anyway, because the answer is cheap and
says whether this file should exist.

- **Re-decision limb, per rejected option.** Option 5 **is** refused by a mechanism:
  `apps/fed/src/content/analytics-schema.test.ts` compares the emitted and presented sets in both
  directions. Calibrated in this record's slice by renaming one event heading in the English edition
  (`### outbound_click` → `### outbound_clicks`) and running
  `npm --prefix apps/fed exec -- vitest run src/content/analytics-schema.test.ts` → `2 failed | 7 passed`;
  restored → green. Options 2, 3 and 4 are refused by **nothing**: no test reads whether a figure is on
  a page, and nothing stops a member being added to both `NAV` and `NavArea` together. So the record is
  owed for those three.
- **Capability limb.** No capability table is published yet. On the working partition recorded on
  [#456](https://github.com/tedeuxx/tadeumendonca-io/issues/456), the GA4 records sit with
  publication-and-distribution and ADR-0023 with delivery-and-gates. This record is a file of its own
  until that fold runs, and then it goes wherever ADR-0051 goes.

## Decision outcome

**Chosen: option 1.** Concretely, as built in PR #797:

- **The route** is `/analytics`, in `STATIC_ROUTES` in `apps/fed/scripts/routes.mjs`, so it is
  prerendered in both locales, listed in the sitemap and given hreflang alternates like every other
  static route. Off the menu is a property of the navigation, not of the route table.
- **The body** is long-form markdown, one file per locale (`apps/fed/src/content/analytics.en.md` and `apps/fed/src/content/analytics.pt.md`),
  rendered through the shared `MarkdownPage` shell; the chrome is the `analytics` group in
  `apps/fed/src/i18n/messages.ts`, both locales.
- **The fidelity check** is `apps/fed/src/content/analytics-schema.test.ts`. It reads the emitted schema
  from `apps/fed/src/lib/analytics.ts`'s **source text** (the schema is types, which do not exist at
  runtime), reads the presented schema from **each** edition, and requires them equal in both
  directions, per event name and per parameter name. The parse is bounded: an emitter in a shape it does
  not recognise throws rather than dropping out of the comparison, and no other module may call the
  tracking functions with a name of its own.
- **The only door** is a link in the body of `/architecture`, in both editions, asserted per edition on
  the rendered, locale-prefixed `href` (`apps/fed/src/pages/ArchitecturePage.test.tsx`).
- **`NAV` and `NavArea` are unchanged.** A `nav_click` made from this page reports `from: 'other'`, and
  the page says so in its `nav_click` section, because it is a page about what the events can and cannot
  see.
- **No claim about what is queryable.** The page states that registration in the GA4 console is outside
  every check and points at ADR-0051 for the obligation.

## Consequences

**Good**
- The page cannot name an event or a parameter the code does not emit, and the code cannot emit one the
  page does not name, without the build going red.
- No figure, no network call, no credential and no new dependency; nothing on the page ages between
  builds except the prose.
- The consent gate's price — every count is a floor — is now stated where a reader sees it, in both
  editions.

**Bad / accepted costs**
- **The check covers names only.** What each event *can* and *cannot* establish is prose, and it is held
  by review alone. Those sentences restate ADR-0051's semantics, so an amendment there can leave the
  page wrong with every check green.
- **The emitted set is parsed from TypeScript source with regular expressions.** A refactor of
  `analytics.ts` into a shape the parser does not read turns the test red for a reason unrelated to the
  page. That is the bounded parse working, and it is still maintenance.
- **A new permanent public URL pair**, with title and OG card pinned on first fetch. A later rename of
  the route or its title is a re-pin on every surface that already unfurled it.
- **Menu clicks from this page are unclassified.** They report `other`, indistinguishable from any other
  path outside the `NavArea` table. Accepted by decision 3.
- **One door.** Apart from the sitemap and a direct URL, the page is reachable only through one sentence
  in `/architecture`. If that sentence is rewritten without the link, the link test goes red; if the
  section is cut, the page is orphaned from navigation.
- **The `slug` dimension carries one more page name.** `share_open` on this page reports
  `slug: 'analytics'`, beside `architecture`, `ramp-up` and real article slugs, which is the reuse #597
  already priced.
- **Promotion later spends a `NavArea` member with no history from that day**, under ADR-0051. That is
  the later decision's cost, priced then.

## Links

- Issue [#640](https://github.com/tedeuxx/tadeumendonca-io/issues/640) — the ask and the three rulings ·
  [PR #797](https://github.com/tedeuxx/tadeumendonca-io/pull/797) — the implementation.
- [ADR-0023](./0023-observability-static-site.md) — amended by this record: the site now publishes a
  description of its own telemetry.
- [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md) — the schema the page renders; not
  amended.
- [ADR-0033](./0033-ga4-consent-gated-analytics.md) — the consent gate the page states; not amended.
- [ADR-0045](./0045-document-title-leads-with-section-label.md) — the title convention, qualified for an
  off-menu section in its 2026-11-01 amendment.
- [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) and
  [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) — the route follows the existing
  per-locale rule; neither is amended.
- [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md) —
  the proposed entry rule, applied above.
- Implementation: `apps/fed/scripts/routes.mjs`, `apps/fed/src/pages/AnalyticsPage.tsx`,
  `apps/fed/src/content/analytics.en.md` and `apps/fed/src/content/analytics.pt.md`, `apps/fed/src/content/analytics-schema.test.ts`,
  `apps/fed/src/i18n/messages.ts`, `apps/fed/e2e/analytics-schema.spec.ts`.
