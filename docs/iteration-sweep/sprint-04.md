routes emitted: 22 / routes visited: 0

route × viewport observations (browser): 0 / 44 planned · routes probed over HTTP (no render): 22 / 22

# Sprint 04 — production sweep

**FAILED — the browser's first navigation was refused, so no route was rendered.** The route generator
ran and returned 22 targets; the browser started; the first navigation to the production origin was
blocked by the browser's own origin allowlist. That is a fail-loud condition in the procedure
(*the first navigation errored*, and *routes visited is less than routes emitted*), so this report is
**not** "no findings". The HTTP probe below is a supplement that settles a few mechanical questions
without a browser. It is **not** a render, not a viewport check and not a console or runtime-network
check, and it does not change the FAILED label.

Driver: `product-lead`. Observed 2026-09-24, around 15:17 UTC. Target: `https://tadeumendonca.io`.
Route-source revision: `cdf0948dfaa10f85e5ff06a10341fce3f482c998`, the `main` tip (the `v1.1.128` bump).
Procedure: `commands/sprint-review.md` and `agents/product-lead.md` in `tadeumendonca-skills` at
`5cc43a2f`. Everything here is **advisory and droppable**. No Issue was opened and no copy was changed.
No observation is promoted to a blocking truth finding.

## Why the sweep failed, and the one change that unblocks it

The browser server this harness ships bounds navigation with
`--allowedUrlPattern ${HARNESS_SWEEP_ORIGIN:-http://127.0.0.1:9/*}`. The fallback points at the discard
port on purpose, so the bound fails closed (ADR-0004 in `tadeumendonca-skills`). In this session the
variable was not set:

```sh
echo "HARNESS_SWEEP_ORIGIN=${HARNESS_SWEEP_ORIGIN:-unset}"   # -> HARNESS_SWEEP_ORIGIN=unset
```

Both navigations attempted, to `https://tadeumendonca.io/pt` and `https://tadeumendonca.io/`, returned
*"blocked by blocklist/allowlist rules"*. The driver did not try to work around the bound. Changing the
browser's configuration is the owner's act, not a sweep's.

**To unblock:** start the session that runs `/sprint-review` with `HARNESS_SWEEP_ORIGIN` set to the
production origin pattern in the environment the browser server inherits, then re-run this rite. Until
then the rite fails at the first navigation, every time, on this host. That is the fail-closed design
working, and it also means the rite cannot run.

## Scope and derivation

```sh
node --input-type=module -e "const m = await import('/Users/tadeumen/git-reps/tadeumendonca-io/apps/fed/scripts/routes.mjs'); console.log(JSON.stringify(m.localizedRoutes()))"
# -> 22 targets: 11 pt, 11 en
```

**Nothing was weighted, and here is why.** `sprint-04` held two `loop` Issues, `tadeumendonca-skills`
#508 and #509 (the Codex hook and persona surfaces). Both closed on 2026-09-24. Neither touched this
repository. The last `tadeumendonca-io` merge is #676 (sprint-03, `CLAUDE.md` only). The last deploy
run that actually published the app predates both iterations:

```sh
gh issue list --repo tedeuxx/tadeumendonca-skills --state all --limit 30 --json number,state,closedAt,milestone
gh pr list --repo tedeuxx/tadeumendonca-io --state merged --limit 5 --json number,title,mergedAt
gh run view 35942452497 --repo tedeuxx/tadeumendonca-io --json jobs --jq '[.jobs[]|{name,conclusion}]'
# -> the #676 merge's deploy run: release success, gate success, deploy-app SKIPPED, e2e skipped
```

So the live surface should not have changed since the sprint-03 sweep. That expectation is itself
untested, because nothing here was rendered.

## Mechanical — evidence and gaps

| check | result | evidence |
|---|---|---|
| renders, phone + desktop | **NOT RUN.** Browser navigation refused | 0 / 44 route × viewport observations |
| console errors | **NOT RUN** | no page loaded |
| failed network requests at runtime | **NOT RUN.** See the HTTP probe for served assets only | no page loaded |
| each route is served as its own page | **PASS over HTTP, 22 / 22.** Each returned a route-specific `<title>`, the right `lang` and a self-canonical | probe below |
| assets referenced in the served HTML | **PASS over HTTP, 35 / 35.** Every same-origin `src`/`href`/`srcset` returned 200, and none came back as HTML | probe below |
| images without `alt` in served HTML | **0** across the 22 pages | probe below |
| CV PDF | **PASS over HTTP.** `/cv.pdf` → 200 `application/pdf`, 474,533 bytes, starts `%PDF-`, ends with a `%%EOF` marker, sha256 prefix `b01aed99e10c`. Both profile pages link it | probe below |
| both locales | **PASS over HTTP.** `pt` pages carry `lang="pt-BR"`, `en` pages carry `lang="en"` | probe below |

**The HTTP status is not the evidence, and it was calibrated to prove that.** A path that does not
exist, `/pt/zz-sweep-nonexistent-probe`, also answers **200**, with a body byte-identical to `/en`. So
the "served as its own page" row rests on the route-specific `<title>`, `lang` and canonical, never on
the status code. For `/en` itself, whose title is the same as the fallback's, the probe can't tell the
real page from the fallback. **Treat `/en` as unverified even over HTTP.**

The probe script is in the driver's session scratchpad and is not committed. What it does:

```text
for each of the 22 generated targets: GET https://tadeumendonca.io<url>
  -> status, content-type, <html lang>, <title>, rel=canonical, <h1> count, <img> count and alt coverage
  -> collect every same-origin src/href/srcset outside /pt and /en; GET each, flag non-200 or text/html
GET /pt/zz-sweep-nonexistent-probe   (calibration of the catch-all)
GET /cv.pdf                          (status, type, size, %PDF- magic, %%EOF marker)
```

**Mechanical findings to act on tonight: none found. This is not the same as none present.** The
browser half, which is where the motivating defects of this rite were found, did not run.

## Judgement — observation plus taste, not a gate

**Layout: not assessed.** Nothing was rendered, so there is no layout observation to report and none
is implied.

**Wording: no new review.** The driver did not read the private positioning source for this run
because no copy judgement against it was made. No copy changed since sprint-03, so the one re-check
done was sprint-03's located finding. It reproduces from the served HTML:

`published-voice` rule 11: **"At most 6 sections — headings at any level below the title — whatever the
length."** Counting `h2`–`h6` inside the served `<article>` element:

| article | sections per edition |
|---|---|
| `blast-radius-supernova` (pt · en) | 19 · 19 |
| `tres-loops-de-agentes-um-mes` · `three-agent-loops-one-month` | 9 · 9 |
| `o-que-os-meus-agentes-fazem` · `what-my-agents-do` | 5 · 5 (within) |

The horizon is the same as sprint-03's: the next time either article is opened for a revision. This is
not a new finding and should not be counted twice at planning.

**Observations from the HTTP probe. None was checked against a recorded decision, and none is a
regression from this iteration:**

1. **A mistyped Portuguese URL serves the English home, with status 200.** The body of
   `/pt/zz-sweep-nonexistent-probe` is byte-identical to `/en`, with `lang="en"` and a canonical of
   `/en`. A Portuguese reader with a broken link lands on English and gets no "not found" signal.
   Search engines see a soft 404. This may be a deliberate catch-all; the driver did not look for a
   record of it. Horizon: the next time routing or the CDN error mapping is opened.
2. **Both portfolio pages serve no `<h1>`.** `/pt/portfolio` and `/en/portfolio` start at `h2`. Every
   other generated page has one. This comes from served HTML, so it has not been confirmed in the
   hydrated DOM. Horizon: the next time the portfolio page is opened.
3. **Articles serve two `<h1>`s:** the section label ("Blog") and the article title. Taste only, since
   there is no ruler for heading structure here. Horizon: the same as item 2.
4. **The footer shows `v1.1.124`, while `main` is `v1.1.128`.** This is consistent with docs-only merges
   skipping `deploy-app` (see the run above), so the label describes the last app build, not the last
   release. Not a defect as observed. It becomes one only if a reader is told the footer means
   "current release". The portfolio's harness label reads `v2.0.58`, and the harness is at `2.0.82`.
   This probe did not establish whether that label is built in or fetched.

## What this sweep could not see

- **Everything a browser would have seen**: rendering at 1440 × 900 and at a phone width, console
  output, runtime network requests (anything fetched after hydration), lazy-loaded images, the menu and
  its interaction states, and every layout property. That is the whole class this rite exists for.
- **Anything behind an interaction, anything time- or state-dependent, and anything only a real phone
  shows.** These are out of reach even when the sweep runs.
- **The `/en` home page**, which can't be told apart from the catch-all fallback over HTTP (see the
  calibration above).

**This is a lower bound, and in this run a low one.** Of the procedure's two halves, the mechanical one
ran only as an HTTP substitute, and the judgement one ran only as a re-check of an existing finding.

## Relation to the sprint-03 report

`docs/iteration-sweep/sprint-03.md` rendered all 22 routes at both viewports earlier on the same day,
through a different harness's browser. For the rendered surface, that report is the most recent
browser evidence. For the served assets and the CV PDF, this report's HTTP probe is the more recent
evidence.
