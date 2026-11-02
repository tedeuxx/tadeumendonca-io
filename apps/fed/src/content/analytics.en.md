## Before any number, what the number can see

When I read the analytics of a digital product, the first question I ask is not how many. It is what each signal is able to miss. A count is only as good as the observation underneath it, so I want to see the observation before I read the count.

So this page does the opposite for this site. It carries no figure from GA4 and no chart. It lists every event the site's own browser code sends, the parameters each one carries, what it can establish and what it cannot. The list is read off the code, not off my memory: a test compares the events presented here with the ones [`analytics.ts`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts) emits, in both directions, so an event added to the code without this page, or an entry here with no code behind it, breaks the build.

## Every count is a floor

Nothing reaches Google until you accept analytics. Before a choice, on decline, and on a build with no measurement id, the tag is never loaded, so Google sets no cookie and receives no request. If you accept and later withdraw, this site's code sends nothing more from then on. The tag itself stays loaded, though, and what it collects on its own, such as the automatic measurement GA4 can switch on for a property, depends on a console setting this repository cannot observe. That gate is a decision with its reasons written down in [ADR-0033](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0033-ga4-consent-gated-analytics.md).

The consequence is that whoever declines is never counted, and neither is whoever blocks the tag. Every number GA4 holds about the events this site's code sends is therefore a floor, never a total, unless that automatic collection counts the same thing a second time ([ADR-0023](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0023-observability-static-site.md)). That is the price of the gate, and I would rather pay it than count people who said no.

## The one cookie set before any choice

One cookie is set on every page, whatever you choose about analytics, and it is this site's own, not Google's: `locale_hint`. It holds `pt` when the country your connection appears to come from speaks Portuguese, `other` when it does not, and `unknown` when no country arrived. It is used for one thing: when you open an address that names no language, such as the bare tadeumendonca.io, `pt` opens the site in Portuguese, unless you have already chosen a language. An address with `/en/` or `/pt/` in it always decides by itself. It carries no identifier and no other location. Each page you open renews it for one hour.

## Emitted is not the same as queryable

This page describes what the site **emits**. That part is known to this repository, because it is the code. What can be **queried** in GA4 is a different fact: a parameter only becomes something you can segment by once it is registered as a custom dimension in the GA4 console, and registration does not backfill. A parameter emitted before its registration cannot be queried in GA4 for that period, permanently.

That console step sits outside every check this repository runs, and nothing here can observe whether it was done. So this page makes no claim about what is queryable. The reasoning, and the obligation, are in [ADR-0051](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0051-ga4-event-schema-is-immutable-once-shipped.md).

GA4 also attaches fields of its own to every hit that this site does not set, such as the browser's language and the screen size. Those are not listed here: this page covers what this site's code sends, not everything the tool records.

## The events

Every custom event carries `locale`, the edition the reader is on. Each name is fixed from the moment it starts collecting, because GA4 does not migrate history when a name changes. It starts a second series and leaves the first one looking complete. So each name says what the browser can observe, never what I would like it to mean.

### `page_view`

**Parameters:** `page_location` on the first hit of a page load · `page_path` on each later route change

**What it establishes:** that a page was displayed to a reader who had accepted analytics. The first one of a page load is sent when the GA4 tag starts, and this site's code sets its `page_location` explicitly: the address the reader arrived on, captured before consent so that a shared link's campaign tags survive a late accept. Each later one is sent by this site's code on a route change inside the site, carrying `page_path`: the path and its query string.

**What it cannot establish:** that anything on the page was read. And one reader is recorded wrongly, as an accepted cost of keeping those campaign tags: someone who lands on one page, moves to a second and only then accepts is recorded on the first, and the second is never counted.

### `article_progress`

**Parameters:** `locale` · `slug` · `percent`

**What it establishes:** that the block that marks 25%, 50% or 75% of the article, counted in blocks, entered the viewport. At most once per article and milestone in a browser tab's session.

**What it cannot establish:** reading. On a large screen the 25% block is often visible at load, before the reader does anything. Its job is to be a precondition for the next event, not a measure of its own.

### `article_end_reached`

**Parameters:** `locale` · `slug`

**What it establishes:** that the last block of the article's prose entered the viewport, that the 75% block had already done so, and that enough time had passed for the words to have been possible to read. That time is derived from the article's length at 1,000 words per minute, with a five-second minimum: not an average reading speed, the edge of the physically implausible.

**What it cannot establish:** a read. It is a proxy, which is why it is not called `read`. A reader who reaches the end past the milestones and leaves the tab open until the time floor passes is counted without having read; one who reads carefully and leaves a paragraph before the end is not.

### `share_open`

**Parameters:** `locale` · `slug`

**What it establishes:** that the share control was opened. On an article `slug` is the article's; on this page and the other long-form pages it is the page's own name, so this page reports `analytics`.

**What it cannot establish:** that anything was shared. And a share from the block always visible at the foot of an article opens nothing, so `share_complete` can exceed `share_open`. That ratio is exact for the dialog and over-counted for the site as a whole.

### `share_complete`

**Parameters:** `locale` · `target`

**What it establishes:** that a share destination was chosen. For the social destinations the composer opens in a new tab.

**What it cannot establish:** that anything was posted. The page never sees what happens in that tab. The only evidence a share actually happened is a later visit arriving through a tagged shared link, which is a different population and does not substitute for this one.

### `contact_reach`

**Parameters:** `locale`

**What it establishes:** that the contact section of the home page entered the viewport. At most once per browser tab's session.

**What it cannot establish:** that the section was read, or even looked at. There is deliberately no time condition. And it cannot say which page sent the reader there, which is what `nav_click` is for.

### `contact_click`

**Parameters:** `locale` · `target`

**What it establishes:** that one of my contact channels was clicked through: GitHub, LinkedIn, X, WhatsApp or email.

**What it cannot establish:** that contact was made. An approach happens on LinkedIn or by email, and both are invisible to this site by construction.

### `nav_click`

**Parameters:** `locale` · `from` · `to`

**What it establishes:** that a menu control was clicked, with the page the reader was leaving captured at the click. Both values come from a closed list of site areas, so no address and no query string can travel in them.

**What it cannot establish:** anything about this page as an origin. This page is not in the menu and has no area of its own, so a menu click made from here reports `from` as `other`. That is a known consequence of keeping it off the menu, not a defect. A click on a link inside the text of a page is not a menu click and sends no `nav_click`.

### `outbound_click`

**Parameters:** `locale` · `href`

**What it establishes:** that a link took the reader off this site by a route that is neither a contact channel nor a share destination. `href` carries the destination's host and path only: no query string and no fragment, so whatever parameters the link's author attached stay behind.

**What it cannot establish:** what happened next, or whether the reader came back. Contact channels and share destinations are deliberately excluded, so they are not counted twice under two names.

## What this page is not

It is not a numbers page. A page publishing GA4 figures would need a credential this static site does not hold, and every figure on it would be unfalsifiable by the reader. This one can be checked against [the code](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts) line by line.
