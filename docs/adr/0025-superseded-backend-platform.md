# 0025. Backend-ful platform (BFF · DynamoDB · Cognito · SES · Lambda@Edge)

- **Status:** superseded by [ADR-0002](./0002-fully-static-spa-no-backend.md) (2026-07)
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
The platform was built as a dynamic, backend-ful product: a **Hono BFF on Lambda**, **DynamoDB** for a
feed/posts/articles/users data model, **Cognito** (social-only Google) for auth and an admin group, **SES**
for a newsletter digest, and **Lambda@Edge** for OG rendering. The site had a unified feed, post
interactions (reactions, moderated comments), short-URLs, and an admin compose surface.

## Why it was decided (then)
The direction at the time was a full product — an interactive, authenticated, dynamic site. A BFF +
DynamoDB + Cognito is a reasonable stack for that, and it exercised real distributed-systems engineering.

## Why it was superseded
The strategy narrowed to **presence through content and portfolio** (ADR-0001). Against that priority, the
entire backend was cost, operational surface, and attack surface serving capabilities the strategy no
longer needed — no audience whose needs justified auth, a database, or a feed. The whole tier was retired
and the site became fully static (ADR-0002).

## Consequences of the reversal
- Near-zero cost and a minimal attack surface (ADR-0002); whole classes of security concern disappeared.
- Lost: dynamic/authenticated capabilities (feed, comments, accounts, newsletter). Recorded as history, not
  as a gap — they can return via ADR-0001's gradual-evolution path if the strategy ever calls for them
  (the dev-loop plugin still catalogs the backend personas for that day).

## Links
- Superseded by ADR-0002 · related reversals: ADR-0026 (Lambda@Edge OG), ADR-0027 (link-unfurl),
  ADR-0028 (GitFlow), ADR-0029 (PWA), ADR-0031 (WAF).
