# sprint-07 — retrospective · product-lead

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: `docs/iteration-sweep/sprint-07.md` (the sweep I drove) · `docs/funnel-review/sprint-07.md`
and `docs/funnel-review/collected/sprint-07.tsv` (the funnel report I wrote) · the
`copy-verdict: product-lead` envelopes quoted in the gate comments on tedeuxx/tadeumendonca-io PRs
#756 and #763, read with
`gh pr view <n> --repo tedeuxx/tadeumendonca-io --json comments`

## Finding 1 — A broken internal link in a published piece was caught only by the iteration-close sweep, one day after release

**What I saw.** The sprint's one new article, `build-your-first-ai-app`, shipped in both editions with
its only link to an earlier piece authored with a locale prefix. The renderer adds the prefix again,
so the served href is `/pt/pt/blog/...` and `/en/en/blog/...`. The catch-all answers 200 with the
English home page, so a reader who follows the piece's one bridge lands on the home page. The doubled
path is in the prerendered HTML, which means a build-time read could have seen it. Every other internal
link under `src/content` is authored without a locale, so this is one authoring slip and not a
pattern. Nothing between drafting and the deploy looked at where internal links resolve.

**The artifact that shows it.** `docs/iteration-sweep/sprint-07.md`, the mechanical table's last row
and the *Mechanical finding to act on* paragraph, including the falsifier
`curl -s https://tadeumendonca.io/en/blog/build-your-first-ai-app | grep -oE 'href="/[a-z]{2}/[a-z]{2}/[^"]*"'`
and the source line `apps/fed/src/content/blog/build-your-first-ai-app.pt.md:83`.

**What it costs.** This is the case the sweep was built for: a defect no gate could see. But it also
shows the sweep's limit as the only safety net. It runs once per iteration, so a defect in a piece
released late in the window is live until the sweep runs, and a piece released early is live for most
of the iteration. A link checker based on status codes would have passed this, because the catch-all
returns 200 for every path. The defect is mechanical, not a claim, so the `content` lane's reviewers
had no reason to look for it.

**The change I propose.** Check that internal links resolve, at build time and against the route
generator: every internal `href` in the prerendered HTML must be a path that
`apps/fed/scripts/routes.mjs` emits (or a known asset). Do not use a status-code check, for the reason
above. How and where to build it belongs to `tech-lead`; I name the class and the falsifier. **The
price of leaving it:** every future piece's internal links are checked once per iteration at best, by
whoever drives the sweep, and only if that driver reads the snapshot's link targets. This time the link
was found by reading, not by clicking.

## Finding 2 — Our own owner-read procedure writes into the audience instrument we judge pieces by

**What I saw.** The owner reads a held piece in the application's preview mode before it publishes.
That is the lane's rule, and it is correct. Those preview reads were recorded as ordinary traffic: 4
page views under the held draft's retired slug, and 2 of the 12 Portuguese reading-progress events,
over a window in which the internal-traffic marking caught 0 sessions and 0 events. The Portuguese
depth figure that the funnel's Finding 1 rests on has n=2 users. One unmarked internal reader would be
half of it.

**The artifact that shows it.** `docs/funnel-review/sprint-07.md`, Finding 2, and the
`internal-traffic:` header line, which says every all-users figure equals the external value. That
holds only as far as the marking does. The corpus note in `docs/funnel-review/collected/sprint-07.tsv`
records that the retired slug is reachable only through preview.

**What it costs.** Two rites that are meant to inform each other work against each other. The
publishing procedure (owner reads at preview) adds noise to the audience rite (`/funnel-review`). At
this traffic volume the noise is not marginal. It is the same size as the signal, so every per-piece
depth figure is an upper bound that cannot be separated from the owner's own reading. A funnel report
that cannot separate the two cannot support a decision about a piece, and that decision is the reason
the rite exists.

**The change I propose.** Preview renders send no analytics, or send only events carrying an explicit
internal marker, so the instrument separates the two by construction rather than by the owner's
devices happening to be covered by a GA4 filter that is still in Testing. That is `tech-lead`'s to
design, with consent and measurement in its scope, and the owner's to rule. **The price of leaving
it:** every funnel review that covers a release window opens with the same caveat, and that is the
window that matters most.

## What I would leave alone

- **The copy lens on small `product` diffs.** #756 and #763 each closed in one pass, with
  `BLOCKING: none` stated, advisories carrying horizons, and a reason for the class. Both Issues
  (#755, #762) are `product`-typed, so the lens was in its lane. #763 typed `The lens is CLOSED`. #756
  did not, and it needed no second round. The envelopes say `SHIP` where my vocabulary says `APPROVE`.
  The meaning is unambiguous, and it is not worth a finding.
- **The sweep's mechanical half and its derived coverage.** 26 emitted and 26 visited, at both
  viewports. The count moved from 24 to 26 and the derivation picked that up with no edit. The rite's
  core design is working.
- **The funnel's refusals.** Not reading 3 → 18 sessions as growth across windows of different
  length, and not picking a channel at n=18, were correct. Keep them.
- **Not counted as a finding, but owed:** the sweep's judgement half is thinning. It took 3 snapshots
  out of 52 renders, did not load `published-voice`, and left seven `sprint-05` items carried over
  without re-checking them. That is a fact about this run, not yet a trend. If `sprint-08` repeats it,
  it becomes a finding.
