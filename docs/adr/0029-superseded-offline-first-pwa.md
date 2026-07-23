# 0029. Offline-first installable PWA

- **Status:** superseded by [ADR-0002](./0002-fully-static-spa-no-backend.md) (2026-07)
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
The frontend was an **installable, offline-first PWA**: `vite-plugin-pwa` with a service worker, a manifest,
and an IndexedDB-persisted outbox (React Query) for queuing reactions/comments offline.

## Why it was decided (then)
For an interactive, backend-ful app with user actions (reactions, comments), offline resilience and
installability were real UX wins — queue an action offline, sync when back online.

## Why it was superseded
The static pivot (ADR-0002) removed the user actions the outbox existed for; there is nothing to queue. An
offline shell for read-only content is machinery without a matching need (ADR-0001). The PWA was removed —
no service worker, no manifest, no offline shell.

## Consequences of the reversal
- Less machinery: no service worker lifecycle, no outbox, no install prompt to maintain.
- Lost: installability and offline reads. Accepted — a read-only content site doesn't need them, and the
  CDN already serves fast.

## Links
- Superseded by ADR-0002 · `src/lib/serviceWorker.ts` remains only to unregister any previously-installed SW.
