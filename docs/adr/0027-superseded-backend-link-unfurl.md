# 0027. Backend link-unfurl / OG preview cards

- **Status:** superseded by [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time) (2026-07; the superseding decision was record 0004, absorbed there by #456)
- **Capability:** `site-platform`
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
Posts could embed curated links that rendered as rich **preview cards** (YouTube/Spotify/OG). Producing
those for arbitrary links needs a request-time fetch of the link's remote OG metadata — done via the
backend (reusing the OG bucket), with X/Instagram degraded pending paid APIs.

## Why it was decided (then)
With a BFF available (ADR-0025), fetching remote OG server-side was straightforward, and rich link previews
improved the feed/posts experience.

## Why it was superseded
Unfurling an arbitrary external link is inherently a **request-time server fetch** — impossible without a
backend (ADR-0002). The feature was retired. What survives is a **client-side embed for known
providers** (a YouTube URL becomes a `VideoEmbed` facade by URL pattern — no server, no remote fetch).

## Consequences of the reversal
- No server-side unfurl of external links; in-article rich media degrades to a known-provider client embed.
- The inverse still holds: the site makes *its own* URLs maximally unfurlable at build time (ADR-0005).

## Links
- Superseded by ADR-0002's build-time-render section (formerly record 0004) · surviving embed is client-side (`VideoEmbed`); own-URL OG is ADR-0005.
