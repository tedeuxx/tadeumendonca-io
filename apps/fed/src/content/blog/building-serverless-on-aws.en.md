---
title: "I retired my own site's backend — and why that was engineering, not laziness"
slug: building-serverless-on-aws
date: '2026-07-22T19:00:00.000Z'
tag: aws
track: engenharia
excerpt: 'This site once ran a full serverless BFF. I switched it all off and went static — the decision, and where serverless actually helps.'
takeaway: 'where serverless actually helps, and where it becomes a cost trap.'
---
## The site you're reading used to have a backend

For a while, `tadeumendonca.io` ran a serious serverless stack: a **Hono** BFF on **Lambda**, **DynamoDB** for data, **Cognito** for login, **SES** for email, all provisioned with Terraform. It worked. And I still **deleted the entire backend** — today it's a static SPA, prerendered at build, served from S3 + CloudFront, with no server at all.

That wasn't giving up on engineering. It *was* the engineering.

## What serverless solves — and what it just defers

Serverless's pitch is real: no server to manage, pay per request, scale to zero. But "scale to zero" only applies to **compute**. Complexity doesn't: a BFF still has an API contract to version, cold starts to measure, IAM permissions to tighten, a Cognito pool to keep, a table to migrate. For a multi-tenant product with per-request logic and data that **has** to live on the server, that cost pays for itself. For a CV page and a few articles, it's debt with no revenue.

## The question that decided it

The question wasn't "is serverless good?". It was: **what here actually needs a server?**

The answer was honest and uncomfortable: nothing. The content is markdown in the repo itself. The OG/SEO meta can be generated at build, prerendering each route. There's no user data, no session, nothing a visitor sends back. A backend there was attack surface and an AWS bill in exchange for zero new capability.

So the backend went. What's left scales to zero for real — in compute **and** in operation: nothing to keep standing, nothing to monitor at 3am, nothing to hot-fix under pressure.

## Where I'd do the opposite

This isn't "serverless is a trap". On the next project with real user state, per-request logic, or data that can't leave the server, I'll go back to Lambda + DynamoDB without a second thought — and there the cost of operating it is fair.

The trap isn't serverless. It's carrying any architecture the problem didn't ask for.
