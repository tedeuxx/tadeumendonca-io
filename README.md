# tadeumendonca-api

Backend API for [tadeumendonca.io](https://tadeumendonca.io) — serverless REST API powering the personal digital presence platform.

## Stack

- **Runtime**: Node.js + TypeScript
- **Compute**: AWS Lambda
- **API**: AWS API Gateway (HTTP API)
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Auth**: AWS Cognito (JWT authorizer)
- **IaC**: See [`tadeumendonca-iac`](https://github.com/tedeuxx/tadeumendonca-iac)

## Architecture

BFF-oriented serverless API. Each Lambda function handles a bounded domain. DynamoDB single-table design. Cognito JWT validation at the API Gateway layer for protected routes.

## Domains

- `/cv` — CV data
- `/feed` — Content feed (public read, admin write)
- `/articles` — Long-form articles

## Related repos

- [`tadeumendonca-fed`](https://github.com/tedeuxx/tadeumendonca-fed) — Frontend
- [`tadeumendonca-iac`](https://github.com/tedeuxx/tadeumendonca-iac) — Infrastructure
- [`tadeumendonca-io-aws-landing-zone`](https://github.com/tedeuxx/tadeumendonca-io-aws-landing-zone) — AWS account foundation
