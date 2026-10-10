routes emitted: 24 / routes visited: 24

route × viewport observations (browser): 48 / 48 · neutral share URLs + bare `/` probed over HTTP only (no render): 7 / 7

# Sprint 05 — production sweep

**The sweep ran.** This sweep is not `FAILED`. The browser reached the production origin on its first
navigation. All 24 generated targets were rendered at desktop (1440 × 900) and at an emulated phone
(390 × 844, mobile, touch). Each render had its console read and its network log read. Each route also
got an accessibility-tree snapshot at desktop.

Driver: `product-lead`. Observed 2026-10-10, between about 16:35 and 16:50 UTC (13:35–13:50 local).
Target: `https://tadeumendonca.io`, serving `v1.2.3`. Route-source revision: `04dcb4ef`, the checkout
this report is written in. `main` is at `45de58a5` (the `v1.2.3` bump). The commits between them are
dependency and workflow bumps (#711, #713), and none of them touches `apps/fed/scripts/routes.mjs`.
Procedure: `commands/sprint-review.md` and `agents/product-lead.md` in `tadeumendonca-skills` `2.0.104`.
Everything here is **advisory and droppable**. No Issue was opened and no copy was changed. No
observation is promoted to a merge-blocking finding.

## Step 0 — the origin bound, re-checked rather than inherited

```sh
git -C /Users/tadeumen/git-reps/tadeumendonca-io show HEAD:.claude/settings.json | jq -r '.env.HARNESS_SWEEP_ORIGIN // empty'
# -> https://tadeumendonca.io/*
```

The first navigation, to `https://tadeumendonca.io/pt`, loaded. Every one of the 48 renders that
followed loaded too. That is the evidence that this browser was bound to the production origin and not
to the fail-closed default. This is the first sprint-review since #683 moved the origin into tracked
configuration. The `sprint-04` report failed for exactly this reason, so this run is also the first
evidence that the #683 carrier works.

## Scope and derivation

```sh
node --input-type=module -e "const m = await import('/Users/tadeumen/git-reps/tadeumendonca-io/apps/fed/scripts/routes.mjs'); console.log(JSON.stringify(m.localizedRoutes()))"
# -> 24 targets: 12 pt, 12 en (6 static routes + 6 articles, per locale)
```

The count grew from 22 to 24 since `sprint-04`. The new pair is #687's article:
`/pt/blog/a-ia-responde-em-segundos-voce-nao-precisa` and `/en/blog/ai-answers-in-seconds-you-dont-have-to`.

**`localizedRoutes()` is not the whole published route set.** The same generator also exports
`neutralArticleRoutes()`, which returns 6 bare `/blog/<en-slug>` share URLs (ADR-0052). Those, plus the
bare `/`, are prerendered and listed in the sitemap:

```sh
node --input-type=module -e "const m = await import('/Users/tadeumen/git-reps/tadeumendonca-io/apps/fed/scripts/routes.mjs'); console.log(m.neutralArticleRoutes().length)"   # -> 6
curl -s https://tadeumendonca.io/sitemap.xml | grep -c '<loc>'   # -> 31 = 24 + 6 + 1
```

The procedure names only `localizedRoutes()`, so the two counts at the top cover the 24. The other 7
URLs were probed over HTTP and were **not rendered in the browser** (see the mechanical table). Covering
them with a browser is a change to the procedure, not something this sweep can decide.

**Weighting.** The judgement half spent its attention on the routes this iteration touched:

- `/pt/blog/a-ia-responde-em-segundos-voce-nao-precisa` and `/en/blog/ai-answers-in-seconds-you-dont-have-to`,
  changed by #687's PRs #689, #690, #692, #693, #694, #697, #698, #699 and #700. These got a desktop
  screenshot, a phone viewport screenshot (EN) and a full-page phone capture (PT).
- `/pt/architecture` and `/en/architecture`, because they publish the claims about the harness that
  #680, #682 and #683 sit beside.

#680, #682 and #683 changed `CLAUDE.md`, `docs/` and `.claude/settings.json` only, so no rendered route
carries their diff. #711 and #713 (dependency and workflow bumps, merged 2026-10-10) rebuilt and
redeployed the whole bundle. That is why every route still got the full mechanical pass.

```sh
gh pr list --repo tedeuxx/tadeumendonca-io --state merged --limit 12 --json number,title,mergedAt,files
```

## Mechanical — evidence and gaps

| check | result | evidence |
|---|---|---|
| renders, phone + desktop | **PASS, 48 / 48.** Every navigation loaded and returned the route's own document title. Every desktop snapshot showed the route's own content, both locales | browser |
| console errors / warnings | **0 errors, 0 warnings, 48 / 48.** The only messages were DevTools `issue` entries: *"Lazy-loaded images should have explicit dimensions"* on `/me` (5), `/architecture` (2) and the badge article (1), in both locales and at both viewports | browser console |
| failed network requests | **0 failed.** Every request in every network log returned 200. No request went to another origin | browser network log |
| missing images | **0.** Every photo, illustration, badge, video poster and avatar request returned 200. No content `<img>` in a snapshot lacked an accessible name | browser |
| CV PDF | **PASS over HTTP.** `/cv.pdf` → 200 `application/pdf`, 474,533 bytes, starts `%PDF-`, ends `%%EOF`. Both profile pages link it. The size is identical to `sprint-04` | `curl` |
| both locales | **PASS.** PT pages render PT chrome and content, EN pages EN | browser |
| neutral share URLs (6) and bare `/` | **PASS over HTTP, 7 / 7 — not rendered.** Each article URL serves its own `<title>`, `lang="en"`, a self-canonical and its `og:image`. All 7 OG images return 200 `image/png`. `/` serves a canonical of `/en` | `curl` |
| `/en` home | **Verified in the browser.** `sprint-04` could not tell it apart from the catch-all over HTTP. The hydrated DOM is the real landing | browser |

**Mechanical findings to act on tonight: none found.** The calibration from `sprint-04` still holds:
`/pt/zz-sweep-nonexistent-probe` answers with the English home (`lang="en"`, canonical `/en`). That is why
no row above rests on a status code alone.

**One environment note, disclosed:** one desktop snapshot was saved by the browser tool into the
checkout root (`.snap-en-blast.txt`) and deleted straight afterwards. The tree is otherwise untouched by
this sweep apart from this file.

## Judgement — observation plus taste, not a gate

The wording ruler is `published-voice`. The private positioning source was **not** read for this run,
because no positioning judgement is made here. Layout has no ruler. Layout items are labelled as taste
and given with the route and viewport. Items are listed most consequential first.

1. **A claim on `/architecture` is stale against the current rules.** This is a truth observation and
   is labelled as one. The agent-tier diagram, both locales, says on a `loop` Issue the `ready` label is
   *"mine alone to apply"* (PT: *"só eu ponho"*), in the box text and in the long description. Since
   the owner's 2026-09-25 ruling on `tadeumendonca-skills` #512, the owner **decides** `ready` on that
   lane and the main session **applies** it once aligned. That ruling is recorded in the `filed → ready`
   `loop` row of the plugin's `agents-configuration` states table (`2.0.104`). Source:
   `apps/fed/src/content/architecture.en.md:144` and `architecture.pt.md:146`, plus each file's
   `accDescr` (the generated `diagrams.json` follows them). The sweep is advisory, so this does not hold
   anything. It is a sentence on a live product page that a reader can check and find wrong. Horizon:
   next iteration.

   Out of scope here: the article `what-my-agents-do` embeds the same diagram, but it is `content`,
   dated before the ruling, and not this lane.
2. **The same diagram's boundary-class sentence rests on two records that disagree.** It says
   boundary-class work *"comes back to me, and only after my go does it ship."* The plugin's ADR-0002
   amendment #16 has the gate merging boundary class with the owner reviewing after deploy, except on
   four holds. This repo's `CLAUDE.md` still describes the boundary class as escalated. The sweep could
   not establish which one is in force for `-io`, so this is advisory: reconcile the record, then the
   sentence. Horizon: same as item 1.
3. **`/en/me` and `/pt/me` state different facts in the 2008–2015 role.** EN says *"Joined as an intern
   in 2008 while completing the Information Systems degree"*. PT says *"Comecei em desenvolvimento web"*,
   with no internship. Source: `apps/fed/src/data/profile.ts:381` against `:389`. The repo's own rule is
   that facts are authored once and shared, so the two editions cannot disagree. This highlight is
   authored twice. `/cv.pdf` prints the EN version. Horizon: next time `profile.ts` is opened.
4. **Video play buttons announce no title.** Eleven facades on `/ramp-up`, `/architecture` and four
   articles, in both locales, expose the accessible name *"Play video: Video"* (PT: *"Reproduzir vídeo:
   Vídeo"*). The card beside each one shows the real title. `VideoEmbed.tsx:87` builds the label from the
   `title` prop and falls back to the generic word. The manifest title the card uses (`:113`) never
   reaches `aria-label` (`:185`). This is an observation with a code pointer, not a wording finding.
   Horizon: next iteration.
5. **The proficiency meters on `/pt/me` speak English:** *"Proficiency level 4 of 4"*. The library page
   in the same locale says *"Nota 3 de 5"*. The ruler is `apps/fed/CLAUDE.md`: *"never hardcode a UI
   string"*. Horizon: next time `/me` is opened.
6. **The WhatsApp contact link on the EN pages prefills Portuguese text** (*"Olá Tadeu, vim pelo
   tadeumendonca.io"*). This is an observation. It may be intended. Horizon: next time the contact block
   is opened.
7. **Both portfolio pages have no `<h1>`.** This is now confirmed in the hydrated DOM; `sprint-04` had
   it from served HTML only. Articles still carry two `<h1>`s (*"Blog"* and the title). Both are
   carry-overs, so do not count them twice at planning.
8. **Taste — phone, first visit.** On a PT route seen by a browser set to English, the language
   suggestion and the cookie notice stack at the bottom and cover about a third of a 390 × 844 viewport.
   That is all eight PT static and weighted routes checked at phone width.
9. **Taste — phone home, both locales.** The four call-to-action buttons sit in a ragged two-row grid,
   with row widths that do not line up. The EN hero line *"Learn to build with AI — from everyday life
   to production."* wraps at about half the column width.

**Wording against `published-voice`:** the new article has 5 sections per edition, within rule 11's
*"At most 6 sections"*. No new clause-quotable wording finding was made. The `sprint-03` rule-11 items
on two older articles are unchanged and are not re-counted.

**A `sprint-04` observation that no longer reproduces:** the footer now reads `v1.2.3`, which is the
latest release (`gh release list --repo tedeuxx/tadeumendonca-io --limit 3`).

## What this sweep could not see

- **The 6 neutral share URLs and the bare `/` in a browser.** They were checked over HTTP only.
- **Below the first phone viewport on 22 of 24 routes.** Phone viewport screenshots were taken on the
  two homes, `/pt/me`, the PT portfolio, ramp-up, architecture and library, and the EN weighted
  article. The PT weighted article got a full-page capture. Every other phone render was checked by
  console and network only. In particular, no one looked at how the wide diagrams on `/architecture`
  behave at 390 px.
- **Anything behind an interaction:** the menu, dialogs, share sheets, video playback, consent states.
  The page was never clicked, so every render is a first visit with no consent given.
- **A real phone.** The phone here is emulated, with no real device, real fonts or real network. The
  layout defects that motivated this rite were found on a real phone.

**This is a lower bound.** The mechanical half covered every generated route at both viewports. The
judgement half spent its depth on four routes.

## Relation to the sprint-04 report

`sprint-04` failed at its first navigation and fell back to HTTP. For the rendered surface, the most
recent browser evidence before this report is `sprint-03`. This report supersedes both for every
generated route.
