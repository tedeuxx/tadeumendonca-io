routes emitted: 22 / routes visited: 22

route × viewport observations: 44 / 44 planned

# Sprint 03 — production sweep

**COMPLETED WITH NAMED GAPS — not FAILED.** All emitted localized routes were visited at both requested viewport sizes, so none of the procedure's fail-loud conditions held (see *Failure accounting*). That does **not** establish a clean mechanical pass: request failures were not observable through the available browser API, the PDF download was not confirmed in the browser, and the image check is only a visual sample. This report is a **lower bound**, not acceptance or a merge clearance.

*Label corrected after the sweep by its report owner:* this report first read **FAILED**. The procedure reserves FAILED for a sweep that could not run: the generator did not run, the browser never started or its first navigation errored, fewer routes were visited than emitted, or the report could not be written. None of those held here. The gaps are real and are kept below as gaps.

*Same-day follow-up:* `docs/iteration-sweep/sprint-04.md`, written later on 2026-09-24, re-checked the served surface over HTTP and settled the CV PDF file (see the PDF item below). Its browser pass failed, so for the **rendered** surface this report is still the most recent browser evidence.

Driver: `product-lead`. Observed on 2026-09-24; browser cleanup completed at 11:19 UTC. Target: `https://tadeumendonca.io`. Route-source revision: `cdf0948dfaa10f85e5ff06a10341fce3f482c998`. Procedure: `commands/sprint-review.md` and `agents/product-lead.md` from the local harness checkout at `1afb64578a505fe1e62d911b399fe387c33b0b98` (2.0.79).

All observations and proposals here are **advisory and droppable**. No Issue was opened, no product copy was changed, and no sweep observation is promoted to a blocking truth finding.

## Scope and derivation

The authorized entry snapshot contained the worklog/velocity item, `tadeumendonca-skills` #499. Its closed state and milestone were read with:

```sh
gh issue view 499 --repo tedeuxx/tadeumendonca-skills --json number,state,closedAt,milestone
gh pr view 676 --repo tedeuxx/tadeumendonca-io --json number,title,files,mergedAt,mergeCommit
```

The Issue returned `CLOSED`, completed at `2026-09-24T01:29:56Z`, in `sprint-03`. The consuming-repository carrier change in PR #676 changed `CLAUDE.md`, not an application route. **No route received extra weight on the claim that this iteration changed it.** Every emitted route received the same baseline observation. The CV journey received an additional download attempt because it is a standing mechanical check, not because the iteration changed it.

The route module was read in full before deriving targets. The following command returned the count and the target objects; it was repeated at the report's base revision with the same result:

```sh
node --input-type=module -e "const m = await import('/Users/tadeumen/git-reps/tadeumendonca-io/apps/fed/scripts/routes.mjs'); const r=m.localizedRoutes(); console.log(JSON.stringify({count:r.length,routes:r},null,2));"
git -C /Users/tadeumen/git-reps/tadeumendonca-io rev-parse HEAD
```

The denominator is `localizedRoutes()`: 11 Portuguese and 11 English targets. Bare-root, neutral article entry paths, and redirect-only aliases were not added to this denominator and were not swept. The inventory below records this run's generated targets; it is not a maintained route list for future runs.

## Mechanical — evidence and gaps

### Method and evidence boundary

The browser-client API controlled the selected Chrome extension browser. Its documented viewport capability was set to **1440 × 900** and **390 × 844**. This was desktop Chrome at a narrow viewport, **not a physical phone or proof of mobile user-agent emulation**. The existing Chrome session was not proved to be an isolated, disposable profile. An enforced origin restriction was not established either. No authentication, form submission, data entry, page-script evaluation, or change to browser security settings was performed. Only the production origin was navigated. The viewport override was reset and the created tab was closed afterward.

Each route/viewport observation used navigation followed by a DOM snapshot, captured warning/error logs, asset inventory, and a viewport screenshot. The operative calls were:

```js
await viewport.set({ width: 1440, height: 900 }); // then 390 × 844
await sweepTab.goto('https://tadeumendonca.io' + route);
const snapshot = await sweepTab.playwright.domSnapshot();
const logs = await sweepTab.dev.logs({ levels: ['error', 'warn'], limit: 100 });
const assets = (await pageAssets.list()).summary;
await nodeRepl.emitImage(await sweepTab.screenshot({ fullPage: false }));
```

Snapshots and inventory summaries were retained in the session's `sweepRows`; screenshots were emitted into the execution transcript and inspected there. Screenshots are not committed attachments. A later reader can rerun these checks, but this markdown alone does not reproduce the original pixels. The same tab was reused, without claiming a fresh cache or clean session per route.

The final session count was derived, not estimated:

```js
new Set(sweepRows.map(x => x.route)).size; // 22
sweepRows.length; // 44
sweepRows.flatMap(x => x.logs).length; // 0 captured entries
sweepRoutes.map(route => ({
  route,
  desktop: sweepRows.filter(x => x.route === route && x.viewport === '1440x900').length,
  phone: sweepRows.filter(x => x.route === route && x.viewport === '390x844').length
})); // each row: desktop 1, phone 1
```

### Observed route × viewport inventory

`Observed` means the route's content appeared in the DOM and its initial viewport screenshot was inspected. It does **not** mean all network requests or all below-fold images passed. `[]` is the captured console result at both observations, not a claim that the origin never emits errors.

| Generated URL path | 1440 × 900 | 390 × 844 | Captured warnings/errors |
|---|---|---|---|
| `/pt` | Observed | Observed | `[]` / `[]` |
| `/pt/me` | Observed | Observed | `[]` / `[]` |
| `/pt/portfolio` | Observed | Observed | `[]` / `[]` |
| `/pt/ramp-up` | Observed | Observed | `[]` / `[]` |
| `/pt/architecture` | Observed | Observed | `[]` / `[]` |
| `/pt/library` | Observed | Observed | `[]` / `[]` |
| `/pt/blog/blast-radius-supernova` | Observed | Observed | `[]` / `[]` |
| `/pt/blog/meu-compromisso` | Observed | Observed | `[]` / `[]` |
| `/pt/blog/da-cloud-a-ia-com-o-mesmo-cracha` | Observed | Observed | `[]` / `[]` |
| `/pt/blog/tres-loops-de-agentes-um-mes` | Observed | Observed | `[]` / `[]` |
| `/pt/blog/o-que-os-meus-agentes-fazem` | Observed | Observed | `[]` / `[]` |
| `/en` | Observed | Observed | `[]` / `[]` |
| `/en/me` | Observed | Observed | `[]` / `[]` |
| `/en/portfolio` | Observed | Observed | `[]` / `[]` |
| `/en/ramp-up` | Observed | Observed | `[]` / `[]` |
| `/en/architecture` | Observed | Observed | `[]` / `[]` |
| `/en/library` | Observed | Observed | `[]` / `[]` |
| `/en/blog/blast-radius-supernova` | Observed | Observed | `[]` / `[]` |
| `/en/blog/my-commitment` | Observed | Observed | `[]` / `[]` |
| `/en/blog/from-cloud-to-ai-same-badge` | Observed | Observed | `[]` / `[]` |
| `/en/blog/three-agent-loops-one-month` | Observed | Observed | `[]` / `[]` |
| `/en/blog/what-my-agents-do` | Observed | Observed | `[]` / `[]` |

### Checklist results

- **Render and locales — observed within the stated bound.** Each target produced its route-specific heading/content. Portuguese and English editions appeared on their respective prefixed paths. This does not exercise every interaction or prove translation completeness sentence by sentence.
- **Console — no warning/error entries captured.** Every recorded read returned an empty array. This was a short observation window with an existing browser session; the logger was not calibrated by deliberately causing an error. It is observation, not proof of the absence of all runtime errors.
- **Failed network requests — NOT VERIFIED.** The documented browser API and advertised capabilities offered no network-request log. `pageAssets.list()` is an asset inventory, not a request-status ledger; its presence/counts cannot establish HTTP success, absence of failed requests, or completeness of subresource loading. No substitute fetch, alternate browser, or script evaluation was used to imply that proof.
- **Missing images — PARTIAL.** Initial-viewport screenshots showed the portrait and several article/media images, but the pass did not inspect every image below the fold or prove image decoding. Early captures of the badge article showed an empty image area; a later screenshot on `/en/blog/from-cloud-to-ai-same-badge` at 390 × 844 showed the image rendered. That transient capture is not reported as a broken-image finding. Lazy loading and observation timing remain limitations of this pass.
- **PDF — NOT VERIFIED.** Both profile DOM snapshots exposed a CV link to `/cv.pdf`. On `/en/me` at 390 × 844, the driver armed `waitForEvent('download', { timeoutMs: 10000 })` and clicked the observed `Download CV (PDF)` link. The download event was not obtained: the browser reported that its security/permission check was unavailable and access was not granted. No downloaded file, byte integrity, or PDF rendering was confirmed. The denial was not retried through another method. This is a check blocked by the browser, not evidence that the site's PDF is broken. *Settled later the same day by a read-only HTTP check* (recorded in `docs/iteration-sweep/sprint-04.md`): `/cv.pdf` returned 200 `application/pdf`, 474,533 bytes, starting `%PDF-` and ending with a `%%EOF` marker. That verifies the served file. It does not verify the browser download flow this item attempted.

The public footer observed in this run displayed `v1.1.124`; the portfolio displayed the harness release `v2.0.58`. These are values seen in the DOM/screenshots, not assertions that they match the report's checkout or proof of a deployment fault. The sweep did not identify the deployed commit from those labels.

### Failure accounting

The procedure's explicit fail-loud conditions were checked separately: the generator ran and emitted a nonempty set; the browser started and its first production navigation succeeded; visited routes equalled emitted routes; this report was written directly by its driver. Earlier bootstrap/tool availability interruptions were resolved before this browser pass and are not counted as successful navigation evidence.

**So the status is not FAILED.** Every fail-loud condition was checked and none held. The evidence gaps are still gaps: no network-failure check, no browser-confirmed PDF download, and only partial image coverage. They are reported as named gaps, not hidden behind a FAILED label and not closed by counting visits. The report does not claim a complete mechanical pass or diagnose an outage from a tooling limitation.

## Judgement — observation plus taste, not a gate

**Layout sample:** in the inspected initial viewports, the desktop navigation remained on one row; at the narrow width it became a menu control, the hero actions wrapped, cards stacked, and article headings/body text remained readable. No specific layout change is proposed from this sample. This is observation plus taste, not compliance with an invented layout standard. Below-fold composition and menu-open states were not reviewed.

**Wording — evaluated as a bounded sample.** The driver read the complete `published-voice` skill at the harness revision above and the required private positioning references before this judgement. The review used the captured desktop DOM: page headings and selected opening paragraphs across the generated routes, plus article heading structure and selected opening/closing paragraphs in both locales. The phone screenshots supplied the visual reading context; they were not counted as a second independent copy review. This is not a full-article fact-check, a sentence-by-sentence translation audit, or cross-surface clearance. No private source content is reproduced or paraphrased here.

### Advisory wording finding — section density

`published-voice`, rule 11, states: **“At most 6 sections — headings at any level below the title — whatever the length.”** The captured article DOM exceeds that ruler on these routes:

| Article routes | Section headings per edition |
|---|---|
| `/pt/blog/blast-radius-supernova` · `/en/blog/blast-radius-supernova` | 19 PT / 19 EN |
| `/pt/blog/tres-loops-de-agentes-um-mes` · `/en/blog/three-agent-loops-one-month` | 9 PT / 9 EN |

The counts came from the captured heading nodes, not from the skill's historical examples:

```js
sweepRows
  .filter(x => x.viewport === '1440x900' && x.route.includes('/blog/'))
  .map(x => ({
    route: x.route,
    sectionHeadings: x.snapshot.split('\n')
      .filter(line => /heading .*\[level=[2-6]\]/.test(line)).length
  }));
```

**Direction and horizon:** next time either article is opened for an owner-approved revision, consider consolidating its section structure against rule 11 in both editions. This is a located format finding, not a claim that the argument is false or that the article must be shortened immediately. Restructuring costs an editorial pass and can damage useful evidence navigation; deleting headings alone is not the proposed remedy. It is **advisory and droppable**, does not hold a merge, and creates no work automatically.

No additional wording change is proposed from the sampled passages. That is not a declaration that the unreviewed prose or unswept states are clean. Time-dependent behavior, consent/interaction states, outbound destinations, full-page image coverage, and differences on an actual phone remain outside this lower bound. Only the owner decides whether this proposal becomes work; this report creates none.
