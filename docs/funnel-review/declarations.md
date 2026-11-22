# Funnel-review declarations

The method's funnel-review store contract asks the consuming repository to declare, beside its store,
what the method does not name: the analytics dimensions that carry the piece and the language, how an
edition's key is derived from them, the name of the internal-traffic marking and filter, and any saved
reports the driver reads. This file is that declaration for this repository (#765).

The contract fixes no file name or format for it. The format below is this repository's choice.

## Format

One declaration per line, at column 0, `<key>: <value>`. A line that does not start with one of the
keys below is prose and declares nothing. The keys are read literally by
`apps/fed/scripts/funnel-review-declarations.test.mjs`, which fails when a code-side value stops
matching what `apps/fed/src/lib/analytics.ts` and `apps/fed/scripts/routes.mjs` emit.

**Code-side declarations** state names the code already uses. The test checks each of them.

**GA-side declarations** state names that exist only in the analytics property. Nothing in this
repository can observe them, so each one carries a status first:

- not yet read off the property: the negated status word (`verified` with the prefix `un`), optionally
  followed by the value the repository alone supports;
- read off the property: `verified <YYYY-MM-DD> owner-ga-ui <value>`, where the date is the day the
  value was read in the owner's GA UI session.

That status literal appears in this file only on the GA-side lines, so a search for it counts exactly
the values still outstanding. The test checks the shape of each GA-side line, never its truth.

## Code-side

The shapes, in the order the lines appear:

- `piece-parameter`: the parameter, then each event that carries it;
- `piece-parameter-absent`: each event that does not carry it;
- `language-parameter`: the parameter, then each value it takes;
- `piece-key`: the content file pattern, the derivation function, and the module that defines it;
- `neutral-share`: the path template, then `page-path`.

piece-parameter: slug article_progress article_end_reached share_open

piece-parameter-absent: share_complete

language-parameter: locale pt en

piece-key: apps/fed/src/content/blog/<key>.<locale>.md buildBlogEditions apps/fed/scripts/routes.mjs

neutral-share: /blog/<en-slug> page-path

What each line means:

- **The piece parameter is `slug`**, the localized slug (ADR-0036, *Localized article slugs*), sent on the three events named.
  It is the slug of the edition the reader was on, so the same piece arrives under two values, one per
  language.
- **The language parameter is `locale`**, mandatory on every custom event, with the values `pt` and
  `en`.
- **The piece key is the filename stem** of `apps/fed/src/content/blog/<key>.<locale>.md`.
  `buildBlogEditions` in `apps/fed/scripts/routes.mjs` returns one `{ pt, en }` slug pair per key and
  drops held drafts. To group a figure by piece, map its `slug` value to the key whose pair contains
  it.
- **The neutral share address is the unprefixed `/blog/<en-slug>`** (ADR-0036, *A neutral, self-canonical share URL per article*). It carries no language
  of its own, so it is reported as a page-path figure and is never given a language.

## Two limits a reader must not assume away

1. **`share_complete` carries no `slug`.** Its call sites pass only `locale` and `target`. It can be
   split by piece only through the page path, mapped to a key; it cannot be split through the `slug`
   dimension. ADR-0005 (*The GA4 event schema is immutable once it collects*) makes the event schema immutable, and this declaration changes no emission. The
   `piece-parameter-absent:` line states this, and the test turns red if it stops being true.
2. **`share_open`'s `slug` also takes non-article values**, such as `architecture` and `ramp-up`
   (ADR-0005 (*The GA4 event schema is immutable once it collects*), slice-B amendment). A per-piece reading keeps only the slugs that map to a key returned
   by `buildBlogEditions`, and drops the rest.

## GA-side

The shapes: `ga4-dimension` takes the event parameter, then the status; `internal-traffic-filter` and
`saved-exploration` take the status alone.

ga4-dimension: slug verified 2026-10-24 owner-ga-ui slug

ga4-dimension: locale verified 2026-10-24 owner-ga-ui locale

internal-traffic-filter: verified 2026-10-24 owner-ga-ui Internal Traffic Testing

saved-exploration: verified 2026-10-24 owner-ga-ui none

- **`ga4-dimension:`** is the display name the property registers for each event parameter (Admin,
  Custom definitions). ADR-0005's *The GA4 event schema is immutable once it collects* records the obligation to register both, and the property confirms it: on
  2026-10-24 each was read as an event-scoped dimension whose display name equals its parameter.
  The read was made by the agent inside the owner's GA browser session, not by the owner's own eyes
  (#765).
- **`internal-traffic-filter:`** is the exact name and state (Testing or Active) of the internal-traffic
  data filter, read on 2026-10-24 as `Internal Traffic`, an exclude filter in state Testing. The
  reporting state used by a period is declared separately, on that period's
  `internal-traffic:` line in its collection file and report.
- **`saved-exploration:`** names any saved exploration the driver reads. The property holds none that
  the driver reads, so the value is `none`.

Replacing a GA-side line after the owner's read is a normal merge request. #765 stays open until no
GA-side line carries the outstanding status.

## The per-post record and the baseline (#819)

The shapes: `post-record` takes the record file, then the module that reads it; `post-set` takes each
post a piece must have, as `<platform>` for a text post and `<platform>:<language>` for a video;
`baseline-pieces` takes the number of fully posted pieces the baseline needs.

post-record: docs/funnel-review/posts.md apps/fed/scripts/funnel-posts.mjs

post-set: linkedin x youtube:pt youtube:en

baseline-pieces: 3

**The baseline rule (owner, requirements document section 8): no numeric target is set until three
pieces have shipped under the channel strategy.** The funnel review reports each period's figures and
compares them with the prior period, and sets no target, until the count reaches the number above. The
target is then set from that baseline. Until then a finding may say what the numbers show; it may not
say they missed or met a target.

- **A piece counts only when every post in the post set is recorded for it** in
  `docs/funnel-review/posts.md`. A half-distributed piece does not start the baseline clock.
- **Every post in that record is under the strategy**, so the count reads the record and nothing else.
- `node apps/fed/scripts/funnel-posts.mjs` prints the count, and which posts each uncounted piece still
  lacks.

**Matching a post to its sessions.** The rite reads, for the period, the sessions by session source,
session medium, session campaign, landing page and `locale`, and writes each row into the period's
collection file at column 0:

    session-row: <source> <medium> <campaign> <landing-page> <locale> <sessions>

The method's parser reads only `figure:`, `collected:` and `internal-traffic:` lines, so these rows are
inert to it and stay as the committed evidence. A value with a space, such as `(not set)`, is written
with hyphens. `node apps/fed/scripts/funnel-posts.mjs <period>` reads `collected/<period>.tsv` and prints
one `figure:` line per post and per reader language, named
`sessions_post_<platform>[-<language>]:<piece-key>:<locale>`, which the driver adds to the same file.
A row matches a post when its source, medium and campaign equal the tags of the address the post
carried and its landing page is one of that piece's addresses. Two limits follow from that:

1. **The match sees only the tagged landing.** A reader who opens the link in an in-app browser that
   drops the query, or who arrives later by another route, is not matched to the post.
2. **Two posts with the same tags for the same piece cannot be told apart.** The record keeps one post
   per platform and language for a piece, so this does not arise within the post set.

The GA-side channel grouping for these tags is the owner's to set in his GA session. It is unverified,
and nothing in this repository can observe it.
