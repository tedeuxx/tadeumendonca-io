# 0031. Shared regional WAF

- **Status:** superseded by [ADR-0017](./0017-no-waf-no-cmk-ssm-string-only.md) (2026-07)
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
protection. Adopted the minimal infra posture — **no WAF** (ADR-0017).

## Consequences of the reversal
- Near-zero security-infra cost, matched to an actually-minimal attack surface (ADR-0017).
- Lost: a WAF. Accepted — it defended a surface that no longer exists; it returns if a dynamic surface does.

## Links
- Superseded by ADR-0017 · the WAF defended the retired API/auth tier (ADR-0025).
