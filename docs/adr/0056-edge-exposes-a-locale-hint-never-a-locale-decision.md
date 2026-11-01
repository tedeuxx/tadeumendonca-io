# 0056. The edge exposes a locale hint, never a locale decision — a viewer-response cookie carrying `pt`, `other` or `unknown`

- **Status:** proposed (the edge half of the owner's IP-precedence ruling on
  [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669); it becomes accepted when the owner
  ratifies this boundary-class MR, and the consent question under *Open — the owner's call* is answered
  in that same ratification)
- **Capability:** `locale-and-routing`
- **Date:** 2026-11-01
- **Deciders:** **the owner** — IP geolocation above the browser language, the CPLP map
  («Países lusófonos»), and the bare root included («Raiz também»), all on #669. Written by `tech-lead`
  in the MR that implements it ([PR #803](https://github.com/tedeuxx/tadeumendonca-io/pull/803)); the
  delivery shape, the cookie contract and the value set below are `tech-lead`'s, inside the bounds the
  closed description set.
- **Supersedes / superseded by:** — (**amends** [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md):
  its driver *"never a request-time / Accept-Language edge function"* is narrowed, not reversed; see that
  record's 2026-11-01 amendment)
- **Driven by:** [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669) (slice B1, the edge half) ·
  **consumed by** [#788](https://github.com/tedeuxx/tadeumendonca-io/issues/788) (slice B2, the client
  step) · **keeps** [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)'s split by
  JavaScript execution and its rejected edge redirect · **inherits**
  [ADR-0005](./0005-og-coverage-every-public-url.md)'s pinned-card cost as a constraint it must not touch ·
  **runs on** [ADR-0013](./0013-s3-cloudfront-hosting.md)'s distribution · **reads against**
  [ADR-0033](./0033-ga4-consent-gated-analytics.md) for the consent question it leaves open

## Context & problem

The owner ruled that the reader's country, as the edge geolocates it, comes **before** the browser
language in locale resolution, and that it applies at the bare root as well. The precedence the whole
feature implements is:

```
1. the locale in the URL path        (unchanged — the path keeps winning)
2. a persisted override              (unchanged — an explicit choice outranks any inference)
3. IP geolocation                    <- NEW (client step: slice B2, #788)
4. navigator.languages
5. English
```

**The country is known only at the edge, and the document cannot carry it.** The HTML is one cached
object per URL, identical for every viewer. A viewer-request function can rewrite the request or answer
it, never add to the response. So the fact has to reach the browser by some other channel, and that
channel is what this record decides.

**Three constraints are not tradeable.** A non-JavaScript client (a crawler, a social scraper) must
receive exactly what it receives today at every advertised URL — [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)
rejected an edge redirect for that reason and [ADR-0005](./0005-og-coverage-every-public-url.md) pins a
card on first fetch. The persisted override outranks the IP step. And locale **resolution** stays in the
client, where [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) put it.

**What is not yet known, and is this slice's spike.** Whether a CloudFront Function reads
`CloudFront-Viewer-Country` when the header is named only in an **origin request policy** (no cache-key
cost), or only when it is in the **cache policy** (one cached object per country), is a premise read from
vendor documentation and never measured here. It cannot be measured read-only: local work is read-only
and the distribution changes only through the pipeline. So the slice's own deploy is the spike, and the
post-deploy check is its verdict.

## Decision drivers

- **Non-JS clients see nothing new.** HTML bytes, status, `canonical`, `hreflang` and `x-default` are
  unchanged at every URL.
- **The edge exposes a fact; it never decides.** No routing, no redirect, no body rewrite at the edge.
- **The client step decides before the bare-root redirect without a network round-trip**, or every
  unprefixed visit pays one before it can move.
- **Data minimisation.** The least that answers step 3 leaves the edge, not a location.
- **The spike must be able to fail.** A post-deploy check whose green is the same whether the header
  arrived or not is not a go/no-go.
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)): no new cache
  behavior, no new origin, no fragmentation of the HTML cache unless the spike forces it.

## Considered options

### A. Delivery shape

1. **A viewer-response function sets a short, script-readable cookie on each HTML response (chosen).**
   It runs after the cache, so a shared cached object carries a per-viewer value. The client reads it
   synchronously at first script, so step 3 decides before the bare-root redirect.
   *Trade-off:* the site **stores something on the reader's device before any consent choice**. Whether
   that needs the consent gate is open (below), and if the answer is yes this option fails at its moment
   of use, because a consent-gated hint does not exist on a first visit.
2. **A separate uncached endpoint**, a function answering a dedicated path itself, which the client
   fetches. *Why not, for now:* every unprefixed-path visit waits one more round-trip before it can
   redirect, and it needs a new cache behavior. **Its one advantage is real**: nothing is stored, so the
   consent question does not arise. **This is the reopening route if the owner rules the cookie into the
   consent gate.**

### B. Where the header is enabled

1. **A custom origin request policy naming only `CloudFront-Viewer-Country` (chosen, pending the
   spike).** An origin request policy is not part of the cache key, so the HTML stays one cached object
   per URL; the S3 origin ignores the header. Custom rather than a managed all-viewer policy, because
   those forward `Host`, which an S3 origin behind OAC rejects.
2. **The header in the cache policy.** *Why not, unless the spike forces it:* it makes the country part
   of the cache key, so every HTML document is cached once per viewer country, which lowers the hit
   rate on every page for a value only one function reads. **Its cost is stated here in advance so a
   no-go does not need a new decision about whether to pay it:** on a no-go this record's choice moves
   to this option, the HTML cache fragments by country, and the cost is accepted for the owner's ruling.
   If that cost is judged not worth the feature, the question goes back to the owner, as #669's planning
   note says, and B2 does not start.

### C. What the cookie carries

1. **A locale hint, set for every HTML response, with three values (chosen):**
   - `pt` — the header names a CPLP member state;
   - `other` — the header is present and names any other country;
   - `unknown` — the header is absent, empty or not a string.

   *Trade-off:* one more value than the issue's recommended `pt`/`other`. It carries no more about the
   reader than *"the edge could not geolocate this request"*, and it is what makes the spike conclusive
   (see the *Decision outcome*).
2. **Two values, `pt` and `other`, with an absent header folded into `other`** — the builder's first
   cut and the issue's recommendation. *Why not:* from a runner outside the CPLP, the post-deploy check
   is green whether or not the header reached the function. A detached header and a working function
   read identically, so the spike's one question has no observable answer.
3. **The raw country code.** *Why not:* it puts a location on the reader's device where a hint
   suffices, and it moves the CPLP map into the client, so the map lives in two places (the function for
   nothing, the client for everything) or the function becomes a pass-through that a test cannot hold to
   a contract.
4. **A value only for CPLP viewers, nothing for the rest.** *Why not:* a missing cookie then means *non-
   CPLP*, *header absent* and *function detached* at once, and the check from a non-CPLP runner cannot
   fail.

### D. An edge redirect to the resolved locale — rejected

It changes what a non-JS client receives at an advertised URL, which is
[ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)'s rejected edge redirect and breaks
#660's constraint; a scraper obeys a redirect too, so the one-stable-card property is lost. It also puts
locale **resolution** at the edge, which the ADR-0036 amendment keeps out of it. Not reconsidered.

## Decision outcome

**Chosen: A1 + B1 (B2 on a no-go) + C1.** The edge exposes one fact through a cookie; the client
decides.

### The contract — fixed here, and B2 reads exactly this

| attribute | value | why |
|---|---|---|
| name | `locale_hint` | names what it is (a hint for locale resolution), not where it comes from |
| values | `pt` · `other` · `unknown` | the closed set above; anything else is a defect |
| `Path` | `/` | every route reads it |
| `Secure` | set | HTTPS only |
| `SameSite` | `Lax` | no cross-site use exists |
| `HttpOnly` | **not** set | the client script must read it |
| `Max-Age` | `3600` | every HTML response sets it again, so the lifetime only has to span client-side navigation within one visit; an hour does, and keeps storage short |
| `Expires` | not set | `Max-Age` alone |
| scope | HTML responses on the default behavior only | `content-type` beginning `text/html`; `/assets/*` carries no function and gets none |

**The country map is the owner's, verbatim:** Angola `AO`, Brazil `BR`, Cabo Verde `CV`, Equatorial
Guinea `GQ`, Guinea-Bissau `GW`, Mozambique `MZ`, Portugal `PT`, São Tomé and Príncipe `ST`, Timor-Leste
`TL`, matched case-insensitively. It lives in the function only.

### How the client (B2, #788) consumes it

- **`pt`** — step 3 resolves to `pt`.
- **`other`, `unknown`, an absent cookie, or any value outside the set** — step 3 resolves nothing and
  falls through to step 4 (`navigator.languages`). **`other` does not mean English**; it means *not
  decided by geography*.
- Read synchronously from `document.cookie` at first script, before the bare-root redirect; under
  `window.__PRERENDER__` the step does not run, per
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s *"the prerender is not a visitor"*.
- The client never writes, refreshes or deletes the cookie. The persisted override is a separate key
  and stays above step 3.

The absent-cookie case is real and not only a fault: a response without a `text/html` content type (a
`304` revalidation may carry none; not measured here) is passed through without the cookie, and a visit after the hour lapses with no fresh HTML response has no
cookie. Treating absent as `unknown` is what keeps those cases correct.

### How the spike becomes conclusive

The post-deploy check requests HTML at the live apex and asserts the cookie's value is **`pt` or
`other`**. Both prove the header reached the function, since only a present header produces either;
**`unknown` is the no-go** on the origin-request-policy route. Accepting either geographic value also
removes the unmeasured premise that the runner sits outside the CPLP. A missing cookie is a separate red:
the function is detached, stale or rejected.

**On a no-go:** the header moves to the cache policy (B2 above), the HTML cache fragments by country, and
the check runs again. B2 does not start until the check is green.

## Open — the owner's call: does the cookie need the consent gate?

**This record does not decide it.** #669 put the question to the owner at the boundary-class
ratification, and it stays his.

**The question.** The site now stores `locale_hint` on the reader's device on the first HTML response,
before any consent choice. It carries one of three values, no identifier and no location, lives for an
hour, and is read only by this site's own script. Does it go behind the consent gate
([ADR-0033](./0033-ga4-consent-gated-analytics.md)), or is it set before a choice as built?

**The trade-off, by the three positions available:**

- **Set before a choice, as built.** The feature works on a first visit, which is the visit it exists
  for. The site's published sentence about cookies may read as false (below).
- **Behind the consent gate.** Nothing is stored before a choice. But on a first visit the hint does
  not exist when the client decides, so step 3 never fires on the visit it was ruled for. In practice
  this means **reversing A1 for A2**, the endpoint, which stores nothing and pays one round-trip on each
  unprefixed visit.
- **Set before a choice, and disclosed.** As built, plus the `/analytics` copy names the cookie, what it
  carries and how long it lives. Content work in both locales, outside this slice.

**The copy that may read as site-wide.** `apps/fed/src/content/analytics.en.md`: *"Before a choice, on
decline, and on a build with no measurement id, the tag is never loaded, no cookie is set and no request
is made."* Its pt-BR edition, `apps/fed/src/content/analytics.pt.md`: *"Antes de escolher, se você
recusar, e num build sem identificador de medição, a tag nunca é carregada, nenhum cookie é gravado e
nenhuma requisição é feita."* In context the paragraph is about Google's tag, but *"no cookie is set"*
stands on its own, and once this ships a reader can find a cookie the sentence appears to deny. This MR
does not change that copy.

This is not legal advice and the record claims no legal position. It states the engineering consequence
of each answer.

## Consequences

**Good**

- Non-JS clients are untouched: the HTML is byte-identical and no advertised URL changes behavior. The
  only response change is one `Set-Cookie` header on HTML.
- The client decides at first script with no round-trip, and resolution stays in the client.
- The spike has a falsifiable verdict, and the expected value no longer rests on where the runner sits.
- The map has one home, and the cookie carries a hint, not a location.

**Bad, stated as costs**

- **A second function now runs on every default-behavior response**, after the cache. The existing
  `spa_rewrite` already runs on every page request, so this is not edge compute returning where there
  was none; what is new is a function whose output **varies per viewer**.
- **A runtime error in a viewer-response function fails the response.** The function is written in
  the runtime's conservative subset and guards every missing object; the unit test evaluates the
  shipped bytes, but only the edge can say the runtime accepts them. Rollback is a revert and a merge.
- **Adding an origin request policy changes what reaches the S3 origin.** If OAC signing rejected the
  forwarded header, every page would fail; the plan on the MR and the post-deploy suite are where that
  shows, and the post-deploy suite runs after the apply, not before.
- **Something is stored before consent**, with the question open above.
- **IP is not language.** A Brazilian abroad, a corporate VPN and a reader in Portugal (who gets pt-BR)
  resolve wrongly. The owner accepted this trade on #669.
- **On a no-go, the HTML cache fragments by country**, a hit-rate cost on every page for one function.
- **The `/architecture` claim that the edge function *"touches the URL, nothing else"* becomes
  incomplete.** Correcting it is B2's scope (#788).
- **Nothing observes the client honouring the contract** until B2 ships with its own regression; until
  then the cookie is inert by construction.

## Links

- **Implements the edge half of** [#669](https://github.com/tedeuxx/tadeumendonca-io/issues/669);
  **consumed by** [#788](https://github.com/tedeuxx/tadeumendonca-io/issues/788).
- **Amends** [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) — its 2026-11-01 amendment
  narrows the no-edge driver to *"the edge never resolves a locale"*.
- **Keeps** [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md)'s rejected edge redirect
  and its split by JavaScript execution.
- **Consistent with** [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) — nothing here renders.
- **Runs on** [ADR-0013](./0013-s3-cloudfront-hosting.md)'s distribution, applied pipeline-only per
  [ADR-0014](./0014-terraform-cloud-pipeline-only.md).
- **Leaves open against** [ADR-0033](./0033-ga4-consent-gated-analytics.md) — the consent question above.
