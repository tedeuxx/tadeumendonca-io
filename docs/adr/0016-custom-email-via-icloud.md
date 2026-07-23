# 0016. Custom-domain email via iCloud+, not a mail service

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
The domain needs a professional inbox (`me@tadeumendonca.io`) for contact. Running or renting mail
infrastructure to do that would be cost and operational surface — the opposite of ADR-0001 — for a
single personal mailbox.

## Decision drivers
- ADR-0001: no infra, no recurring cost that an existing subscription already covers.
- Email must be **independent of the site** — the inbox should work whether or not the site is deployed.

## Considered options
1. **Apple iCloud+ Custom Email Domain** (chosen) — Apple hosts the mailbox; the domain is enrolled by
   adding Apple-provided **MX/TXT/CNAME** records to Route53. Uses the iCloud+ subscription the owner
   already has. *Trade-off:* tied to Apple's ecosystem, and the records are Apple-provided (an external
   enrollment step).
2. **AWS SES / WorkMail** — *Why not:* SES is for sending, not a personal inbox; WorkMail is per-mailbox
   cost and setup for something iCloud+ already covers.
3. **Google Workspace** — *Why not:* a new recurring subscription for one mailbox.

## Decision outcome
Chosen: **iCloud+ Custom Email Domain.** Only the DNS records live in this repo's Terraform (Route53);
the mailboxes are Apple's. Email is fully decoupled from the site's deploy.

## Consequences
**Good**
- Zero mail infrastructure and no new subscription — an existing iCloud+ plan does it.
- Independent of the site: the inbox survives any site change.

**Bad / accepted costs**
- Tied to Apple's ecosystem and its enrollment flow; the records are provided by Apple, not derived.
- Sending automated mail (were it ever needed) is out of scope — this is a human inbox, not a
  transactional mail path (that was SES, retired with the backend — History).

## Links
- Driven by ADR-0001 · DNS records in Route53 (`iac/email.tf`), independent of the CloudFront distribution.
