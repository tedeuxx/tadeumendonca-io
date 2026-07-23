# 0017. Minimal infra security posture — no WAF, no CMK, SSM String-only

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the shared regional WAF (History index)
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
At the infrastructure level, a security/encryption posture has to be chosen: a WAF in front of the CDN,
customer-managed KMS keys (CMK) for encryption, encrypted (`SecureString`) SSM parameters. Each is a
real control with real cost — and for a static site with **no dynamic endpoint, no auth, no user data**
(ADR-0002), most of them defend a surface that does not exist.

## Decision drivers
- ADR-0002: the attack surface is minimal — no server, no auth, no database, no request-time compute.
- ADR-0001: don't pay for controls with no threat or compliance driver.
- Keep the config bus non-sensitive by construction, so encryption isn't needed for it.

## Considered options
1. **No WAF · AWS-managed keys (no CMK) · SSM `String`-only** (chosen) — no WAF (nothing dynamic behind
   CloudFront to protect); default AWS-managed encryption (no CMK — no compliance driver for
   customer-managed keys on a static site); SSM parameters are **`String` only**, holding non-sensitive
   names/ids/ARNs (the config bus) — never secrets. *Trade-off:* the posture is calibrated to "static, no
   secrets"; a future dynamic/authenticated surface would need these controls back.
2. **Keep the shared regional WAF** — *Why not:* recurring cost to protect a static bucket behind
   CloudFront with no dynamic endpoints; it defended the retired API/auth tier, not this.
3. **CMK everywhere + `SecureString` SSM** — *Why not:* key-management cost and ceremony with no
   compliance or threat driver; there are no secrets in the config bus to encrypt.

## Decision outcome
Chosen: **no WAF, AWS-managed keys, SSM `String`-only.** Security at the infra level is deliberately
minimal *because the architecture made the surface minimal* (ADR-0002). Runtime secrets, if any ever
existed, would go to Secrets Manager — but there are none. This is the infra half of the security posture;
the application half (Sonar SAST + package-vulnerability scanning) is its own ADR.

## Consequences
**Good**
- Near-zero security-infra cost, matched to an actually-minimal attack surface.
- Nothing to misconfigure: no WAF rules, no key rotation, no encrypted-parameter handling.

**Bad / accepted costs**
- The posture is **calibrated, not permanent**: adding a dynamic or authenticated surface re-introduces
  WAF / CMK / Secrets Manager (ADR-0001's gradual-evolution path).
- Relies on the discipline that SSM holds only non-sensitive config — a secret placed there by mistake
  would be unencrypted (mitigated: nothing sensitive belongs on the bus by policy).

## Links
- Driven by ADR-0001, ADR-0002 · supersedes the shared regional WAF (History index) · the application
  security posture (Sonar SAST + package-vuln) is a separate ADR (pending).
