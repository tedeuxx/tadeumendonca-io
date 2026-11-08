# 0031. Shared regional WAF

- **Status:** superseded by [ADR-0013](./0013-s3-cloudfront-hosting.md#the-minimal-infrastructure-security-posture) (2026-07; the superseding decision was record 0017, absorbed there by #456)
- **Capability:** `hosting-and-trust`
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
A shared **regional WAF** protected the dynamic tier — the API Gateway and Cognito endpoints — as a
security-posture baseline for the backend-ful platform.

## Why it was decided (then)
A public, authenticated API and auth endpoints are a real attack surface; a WAF in front of them is a
sensible baseline control.

## Why it was superseded
Retiring the backend (ADR-0025) removed the dynamic endpoints the WAF protected. A static bucket behind
CloudFront with no dynamic endpoint has nothing for a WAF to defend, so it became recurring cost for zero
protection. Adopted the minimal infra posture — **no WAF** (ADR-0013, *The minimal infrastructure security posture*).

## Consequences of the reversal
- Near-zero security-infra cost, matched to an actually-minimal attack surface (ADR-0013).
- Lost: a WAF. Accepted — it defended a surface that no longer exists; it returns if a dynamic surface does.

## Links
- Superseded by ADR-0013's minimal-posture section · the WAF defended the retired API/auth tier (ADR-0025).
