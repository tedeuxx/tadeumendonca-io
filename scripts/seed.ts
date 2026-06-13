// One-off: seed demo content — the profile (CV), one feed post, one blog article. Idempotent (fixed
// ids + PutCommand overwrite). Published items carry the SPARSE by-created key (gsi_pk), exactly like
// the create path, so they appear in the feed/list (a row without it stays out of the index). Run with
// the three table names + AWS creds that allow PutItem:
//   PROFILE_TABLE_NAME=tadeumendonca-profile-staging \
//   POSTS_TABLE_NAME=tadeumendonca-posts-staging \
//   ARTICLES_TABLE_NAME=tadeumendonca-articles-staging \
//   AWS_REGION=us-east-1 npx tsx scripts/seed.ts
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../src/shared/db/client';
import { FEED_PK, ARTICLE_FEED_PK, type Profile, type Post, type Article } from '../src/shared/types/entities';

const profileTable = process.env.PROFILE_TABLE_NAME;
const postsTable = process.env.POSTS_TABLE_NAME;
const articlesTable = process.env.ARTICLES_TABLE_NAME;
if (!profileTable || !postsTable || !articlesTable) {
  throw new Error('PROFILE_TABLE_NAME, POSTS_TABLE_NAME and ARTICLES_TABLE_NAME are required');
}

// CV content sourced from the owner's Canva design (DAELSwtFAuM) — keep textual.
const profile: Profile = {
  profile_id: 'me',
  name: 'Luiz Tadeu Mendonça',
  headline: 'Senior Software Engineer · Distributed Systems | Cloud-Native Applications | Backend Engineering',
  summary:
    'Senior Software Engineer with experience designing and building distributed systems and cloud-native applications at scale. ' +
    'Strong background in backend engineering, system design and high-performance architectures, with hands-on experience ' +
    'delivering reliable systems in complex environments. Combines deep technical execution with a strong understanding of ' +
    'product impact and real-world system trade-offs.',
  location: 'São Paulo — Brazil',
  experience: [
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Senior Cloud Application Architect',
      start_date: '2021-01',
      end_date: null,
      description:
        'Led cloud-native architecture and application modernization engagements across financial services, energy, ' +
        'food-tech, aerospace and media — acting as hands-on technical lead from system design through implementation.',
      highlights: [
        'Built distributed backend systems with event-driven architectures (SQS/SNS), container orchestration (EKS, ECS) and serverless compute (Lambda/DynamoDB); contributed to React SPA and portal development.',
        'Established cloud enablement foundations through VPC design and reusable Terraform modules, standardizing AWS adoption across client development teams.',
        'Core services: S3, ECS, EKS, Lambda, SQS/SNS, API Gateway, CloudFront, Cognito, Route 53, WAF, DocumentDB, Amazon Verified Permissions, Terraform.',
      ],
    },
    {
      company: 'Globo.com',
      title: 'Senior DevOps Engineer',
      start_date: '2020-06',
      end_date: '2021-01',
      description:
        'Built an end-to-end observability platform for a large-scale D2C streaming launch — covering frontend (Angular), ' +
        'backend (Spring Boot) and infrastructure layers, integrating AppDynamics, Grafana, Prometheus and Zabbix into a unified monitoring solution.',
    },
    {
      company: 'Accenture',
      title: 'Digital Business Integration Consultant',
      start_date: '2008-03',
      end_date: '2020-06',
      description:
        'Acted as application architect for web and mobile products — React, Android and Ionic frontends with Node.js backends — ' +
        'designing distributed systems and integration layers connecting mobile apps, APIs and enterprise platforms.',
      highlights: [
        'Built and integrated large-scale distributed systems across batch and real-time processing using Informatica PowerCenter and SOA, connecting CRM, telecom and e-commerce platforms.',
      ],
    },
  ],
  education: [{ institution: 'PUC-Rio', degree: "Bachelor's Degree", field: 'Information Technology', start_date: '', end_date: '2010' }],
  certifications: [],
  skills: {
    'Cloud & Infra': ['AWS', 'Terraform', 'EKS', 'ECS', 'Lambda', 'API Gateway', 'CloudFront', 'Cognito', 'WAF'],
    Backend: ['Distributed Systems', 'Event-Driven (SQS/SNS)', 'DynamoDB', 'Node.js', 'Spring Boot'],
    Frontend: ['React', 'Angular', 'Ionic'],
    Idiomas: ['Português — Nativo', 'Inglês — Avançado', 'Espanhol — Intermediário'],
  },
  metadata: {
    github: 'https://github.com/tedeuxx',
    linkedin: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/',
    medium: 'https://tadeumendonca.medium.com',
  },
  updated_at: new Date().toISOString(),
};

// Published → gsi_pk set so it shows in the unified feed (by-created GSI).
const post: Post = {
  post_id: 'welcome',
  gsi_pk: FEED_PK,
  title: 'Hello from the feed',
  body: 'First post on the tadeumendonca.io feed. Built on a serverless BFF (Hono on Lambda) with a DynamoDB-backed feed.',
  tags: ['serverless', 'aws'],
  published: true,
  created_at: '2026-06-09T18:00:00.000Z',
};

// Published → gsi_pk set so it shows in the blog list + the unified feed (by-created GSI).
const article: Article = {
  article_id: 'art-welcome',
  gsi_pk: ARTICLE_FEED_PK,
  slug: 'building-serverless-on-aws',
  tag: 'aws',
  title: 'Building Serverless on AWS',
  excerpt: 'How tadeumendonca.io is built: Hono BFF on Lambda, DynamoDB, CloudFront — fully serverless.',
  body: '## Why serverless\n\nThis platform runs on a **Hono** BFF on Lambda, DynamoDB, and CloudFront.\n\n- No servers to manage\n- Pay per request\n- Scales to zero',
  published: true,
  created_at: '2026-06-09T19:00:00.000Z',
};

await ddb.send(new PutCommand({ TableName: profileTable, Item: profile }));
await ddb.send(new PutCommand({ TableName: postsTable, Item: post }));
await ddb.send(new PutCommand({ TableName: articlesTable, Item: article }));
console.log(`seeded profile + 1 post + 1 article (published items carry gsi_pk)`);
