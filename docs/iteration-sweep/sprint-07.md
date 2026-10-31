routes emitted: 26 / routes visited: 26

route × viewport observations (browser): 52 / 52 · neutral share URLs + bare `/` probed over HTTP only (no render): 8 / 8

# Sprint 07 — production sweep

**The sweep ran.** It did not `FAIL`. The first navigation reached the production origin. All 26
generated targets were rendered at desktop (1440 × 900) and at an emulated phone (390 × 844, DPR 3,
mobile, touch). The console and the network log were read for each of the 52 renders.

Driver: `product-lead`. Observed 2026-10-31, after the `v1.2.46` tag (16:04 UTC). Target:
`https://tadeumendonca.io`. The site serves the **`v1.2.45`** build (see judgement item 2). Route
source: `apps/fed/scripts/routes.mjs` at `a94f0f0` (`origin/main`, the `v1.2.46` bump), in the
`review/sprint-07` worktree. Procedure: the `sprint-review` skill (method `v9.0.0`) and the
`product-lead` brief's sweep section. Everything here is **advisory and droppable**. No Issue was
opened, no copy was changed, and nothing here is a merge-blocking truth finding.

There is no `sprint-06.md`. The most recent browser evidence before this report is `sprint-05`.

## Step 0, re-checked rather than inherited

```sh
ps -ax -o pid=,args= | grep -E -- 'chrome-devtools-mcp[^ ]* .*--autoConnect( |$)' | grep -v grep | awk '{b = "unbounded"; for (i = 2; i <= NF; i++) if ($i == "--allowedUrlPattern" || index($i, "--allowedUrlPattern=") == 1) b = "BOUND"; print $1, b}'
# -> 86350 unbounded
git -C <worktree> show HEAD:.claude/settings.json | jq -r '.env.HARNESS_SWEEP_ORIGIN // empty'
# -> https://tadeumendonca.io/*
```

This matches the dispatching session's probe. The browser is the owner's Chrome. Every page was
opened in one isolated browser context (`sweep-sprint-07`), which holds none of his cookies, so every
render is a logged-out first visit. No other tab was touched.

## Scope and derivation

```sh
npm --prefix <worktree>/apps/fed ci --ignore-scripts   # the fresh worktree had no node_modules; the generator imports js-yaml
node --input-type=module -e "const m = await import('<worktree>/apps/fed/scripts/routes.mjs'); console.log(m.localizedRoutes().length, m.neutralArticleRoutes().length)"
# -> 26 7   (13 pt + 13 en: 6 static routes + 7 articles per locale)
curl -s https://tadeumendonca.io/sitemap.xml | grep -c '<loc>'   # -> 34 = 26 + 7 + 1
```

The count grew from 24 to 26 since `sprint-05`. The new pair is the AI-app piece:
`/pt/blog/crie-seu-primeiro-ai-app` and `/en/blog/build-your-first-ai-app`.

The two counts at the top cover `localizedRoutes()` only, as the procedure names. The 7 neutral
`/blog/<en-slug>` share URLs and the bare `/` were probed over HTTP and **not rendered**.

**Weighting.** The judgement half spent its attention on:

- `/pt/blog/crie-seu-primeiro-ai-app` and `/en/blog/build-your-first-ai-app`. PRs #770, #778, #780,
  #784, #786 and #787 changed them (the first two under the piece's earlier slug). They got an
  accessibility snapshot (PT desktop, EN phone) and a screenshot (EN desktop, PT phone).
- Every article's external links, because #785 changed how external links open.

#791, #779, #777, #774, #773, #772 and #769 changed no rendered route. #791's deploy skipped the app
job, so the build being served is the one from 2026-10-30 (`last-modified: Fri, 30 Oct 2026 21:55:12 GMT`).

```sh
gh pr list --repo tedeuxx/tadeumendonca-io --state merged --limit 14 --json number,files
```

## Mechanical: evidence and gaps

| check | result | evidence |
|---|---|---|
| renders, phone + desktop | **PASS, 52 / 52.** Every navigation loaded and returned the route's own document title, in its own locale | browser |
| console errors / warnings | **0 errors, 0 warnings, 52 / 52.** The only messages were DevTools `issue` entries: *"Lazy-loaded images should have explicit dimensions"* on `/me` (5), `/architecture` (2) and the badge article (1). They appear in both locales and at both viewports. This is unchanged from `sprint-05` | browser console |
| failed network requests | **0 failed.** Every completed request returned 200. A few requests were still `pending` when the log was read: a favicon, and some badge images on the two `/me` phone renders. Those same URLs returned 200 on the other renders. **No request went to another origin on any of the 52 renders**, so the cookie notice's *"nothing third-party runs before that"* held for this sweep | browser network log |
| missing images | **0.** Every illustration, photo, badge, avatar and video poster that was requested returned 200 | browser |
| CV PDF | **PASS over HTTP.** `/cv.pdf` returns 200 `application/pdf`, 474,104 bytes. It starts with `%PDF-` and ends with `%%EOF` | `curl` |
| new article OG images | **PASS over HTTP.** `/og/build-your-first-ai-app.{pt,en}.png` both return 200 `image/png` | `curl` |
| neutral share URLs (7) and bare `/` | **PASS over HTTP, 8 / 8, not rendered.** Each article URL serves its own `<title>` and a self-canonical. `/` serves a canonical of `/en` | `curl` |
| external links (#785) | **PASS on the weighted article.** The sample-app link and the third-party repository link are served with `target="_blank" rel="noopener noreferrer"` | served HTML |
| **internal link in the new article** | **BROKEN, both locales.** The *"em outro texto"* / *"in another piece"* link points at `/pt/pt/blog/tres-loops-de-agentes-um-mes` and `/en/en/blog/three-agent-loops-one-month`. Both doubled paths return 200 from the catch-all with `<title>tadeumendonca.io</title>` and canonical `/en`. A reader who clicks lands on the **English home page**, not on the article | snapshot + `curl` |

**Mechanical finding to act on: one, the broken internal link above.** The cause is visible in the
source. `apps/fed/src/content/blog/build-your-first-ai-app.pt.md:83` authors the link as
`(/pt/blog/tres-loops-de-agentes-um-mes)`, and the `.en.md` file authors `(/en/blog/...)` on the same
line. The renderer's locale resolution then adds the prefix a second time. Every other internal link in
`src/content` is authored without a locale (for example `(/library)` in `rampup.en.md:98`). The doubled
path is in the prerendered HTML as well as in the hydrated DOM:

```sh
curl -s https://tadeumendonca.io/en/blog/build-your-first-ai-app | grep -oE 'href="/[a-z]{2}/[a-z]{2}/[^"]*"'
# -> href="/en/en/blog/three-agent-loops-one-month"
curl -s -o /dev/null -w '%{http_code}\n' https://tadeumendonca.io/pt/pt/blog/tres-loops-de-agentes-um-mes   # -> 200 (catch-all)
```

The calibration from earlier sweeps still holds: an unknown path returns 200 and the English home. That
is why a status code alone proved nothing here, and why no gate that checks status codes would have
seen this. Whether to fix it now or with the next edit of the piece is the owner's call. It is a
published `content` piece.

## Judgement: observation plus taste, not a gate

The wording ruler is `published-voice`. It was **not loaded** for this run, and no clause-quotable
wording finding is made. The new piece came through the `content` lane's own review. The private
positioning source was not read, because no positioning judgement is made here. Layout has no ruler,
so layout items are labelled as taste. Items are listed most consequential first.

1. **The broken link above also reads as a content defect.** The sentence it sits in is the piece's
   one bridge to an earlier article, and on both editions it leads to the English home page. It is
   listed here only so planning does not miss it. Do not count it twice.
2. **The latest release does not match the running build.** GitHub marks `v1.2.46` as *Latest*
   (tagged 16:04 UTC today). The site footer says `v1.2.45`, and the portfolio card's release link
   points at `v1.2.45` too. Both labels are truthful about the **running** build, because #791's deploy
   ran `release` but skipped `deploy-app`
   (`gh run view <id> --json jobs` → `deploy-app skipped`). A reader comparing the repository's
   *Latest* badge with the footer will see two different numbers. This is an observation about how a
   non-app merge is versioned, not a defect in what the page says. Horizon: whenever the deploy
   workflow is next opened.
3. **Taste: the cover illustration at 390 px.** On the phone, the "after" screen's details (the
   legend and the *"4 conferências passaram"* badge) are too small to read. The alt text carries them,
   so nothing is lost for a screen reader. Horizon: the next illustration.
4. **The EN back link carries a Portuguese anchor.** *"← ALL ARTICLES"* on the EN article links to
   `/en/#artigos`. It works, because the anchor id is shared, but the fragment is in the other
   language on a page whose path decides the language. Horizon: the next time article chrome is opened.
5. **Carry-over, do not count twice: phone first-visit overlays.** On a PT route seen by a browser set
   to English, the language suggestion and the cookie notice stack at the bottom and cover roughly 40%
   of a 390 × 844 viewport (PT article phone screenshot). This is `sprint-05` item 8, and it still
   reproduces.

**`sprint-05` items not re-verified in this run:** the stale `ready` wording in the `/architecture`
agent-tier diagram (item 1), the boundary-class sentence (item 2), the `/me` 2008 role mismatch
(item 3), the video facades' generic accessible name (item 4), the PT proficiency meters (item 5),
the WhatsApp prefill (item 6) and the heading structure (item 7). A served-HTML grep for the item 1
phrase returned nothing. That grep is not evidence of a fix, because the diagrams may render client
side. Treat these as still open until someone looks.

## What this sweep could not see

- **Per-route accessibility snapshots.** Snapshots were taken on 3 of the 52 renders: PT home desktop,
  the PT weighted article at desktop, and the EN weighted article on phone. This is fewer than the
  `sprint-05` run. On every other route, the evidence of a render is the document title, the console
  and the network log. An element that rendered without the thing it was for would be missed there.
- **Below the first phone viewport,** except on the two weighted articles (one by snapshot, one by
  screenshot of the first viewport only). No one looked at how the wide diagrams behave at 390 px.
- **The 7 neutral share URLs and the bare `/` in a browser.** These were checked over HTTP only.
- **Anything behind an interaction:** the menu, dialogs, share sheets, video playback and consent
  states. Nothing was clicked, so no internal link was followed in the browser. The broken link was
  found by reading the snapshot's link targets, not by clicking.
- **A real phone.** The phone was emulated. The layout defects that motivated this rite were found on
  a real one.
- **Environment note:** the fresh worktree needed `npm ci` in `apps/fed` before the generator would
  run. This created only the ignored `node_modules`; the tracked tree is untouched apart from this file.

**This is a lower bound.** The mechanical half covered every generated route at both viewports, and
it found one broken internal link. The judgement half spent its depth on two routes.
