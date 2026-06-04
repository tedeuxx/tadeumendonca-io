# tadeumendonca-fed

Frontend application for [tadeumendonca.io](https://tadeumendonca.io) — personal digital presence, portfolio and blog.

## Stack

- **Framework**: React + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: React Query + Context API
- **Auth**: AWS Cognito (via Amplify)
- **Hosting**: AWS CloudFront + S3

## Architecture

Frontend-driven architecture consuming the [`tadeumendonca-api`](https://github.com/tedeuxx/tadeumendonca-api) via REST. Auth flows handled through Cognito. Static assets served from S3/CloudFront.

## Features (roadmap)

- [ ] Phase 1 — Digital CV
- [ ] Phase 2 — Content feed (timeline)
- [ ] Phase 3 — Articles

## Related repos

- [`tadeumendonca-api`](https://github.com/tedeuxx/tadeumendonca-api) — Backend API
- [`tadeumendonca-iac`](https://github.com/tedeuxx/tadeumendonca-iac) — Infrastructure
- [`tadeumendonca-io-aws-landing-zone`](https://github.com/tedeuxx/tadeumendonca-io-aws-landing-zone) — AWS account foundation
