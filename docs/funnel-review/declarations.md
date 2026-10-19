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

- not yet read off the property: the status literal you see on the lines below, optionally followed by
  the value the repository alone supports;
- read off the property: `verified <YYYY-MM-DD> owner-ga-ui <value>`, where the date is the day the
  owner read it in the GA UI.

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

- **The piece parameter is `slug`**, the localized slug (ADR-0037), sent on the three events named.
  It is the slug of the edition the reader was on, so the same piece arrives under two values, one per
  language.
- **The language parameter is `locale`**, mandatory on every custom event, with the values `pt` and
  `en`.
- **The piece key is the filename stem** of `apps/fed/src/content/blog/<key>.<locale>.md`.
  `buildBlogEditions` in `apps/fed/scripts/routes.mjs` returns one `{ pt, en }` slug pair per key and
  drops held drafts. To group a figure by piece, map its `slug` value to the key whose pair contains
  it.
- **The neutral share address is the unprefixed `/blog/<en-slug>`** (ADR-0052). It carries no language
  of its own, so it is reported as a page-path figure and is never given a language.

## Two limits a reader must not assume away

1. **`share_complete` carries no `slug`.** Its call sites pass only `locale` and `target`. It can be
   split by piece only through the page path, mapped to a key; it cannot be split through the `slug`
   dimension. ADR-0051 makes the event schema immutable, and this declaration changes no emission. The
   `piece-parameter-absent:` line states this, and the test turns red if it stops being true.
2. **`share_open`'s `slug` also takes non-article values**, such as `architecture` and `ramp-up`
   (ADR-0051, slice-B amendment). A per-piece reading keeps only the slugs that map to a key returned
   by `buildBlogEditions`, and drops the rest.

## GA-side

The shapes: `ga4-dimension` takes the event parameter, then the status; `internal-traffic-filter` and
`saved-exploration` take the status alone.

ga4-dimension: slug unverified

ga4-dimension: locale unverified

internal-traffic-filter: unverified

saved-exploration: unverified none

- **`ga4-dimension:`** is the display name the property registers for each event parameter (Admin,
  Custom definitions). ADR-0051 records that both are registered. That is a record's claim, and the
  display names have not been read off the property.
- **`internal-traffic-filter:`** is the exact name and state (Testing or Active) of the internal-traffic
  data filter. The reporting state used by a period is declared separately, on that period's
  `internal-traffic:` line in its collection file and report.
- **`saved-exploration:`** names any saved exploration the driver reads. The repository names none, so
  the provisional value is `none`.

Replacing a GA-side line after the owner's read is a normal merge request. #765 stays open until no
GA-side line carries the outstanding status.
