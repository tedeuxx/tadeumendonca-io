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

const profile: Profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Software Engineer — Cloud & Serverless',
  summary: 'Building scalable, secure, cost-efficient products on AWS.',
  location: 'Brazil',
  experience: [
    {
      company: 'tadeumendonca.io',
      title: 'Founder / Engineer',
      start_date: '2026-01',
      end_date: null,
      description: 'Personal platform — serverless BFF + SPA on AWS.',
      highlights: ['Terraform IaC', 'Hono BFF on Lambda', 'DynamoDB', 'Cognito + WAF'],
    },
  ],
  education: [],
  certifications: [],
  skills: {
    cloud: ['AWS', 'Terraform', 'Serverless'],
    backend: ['TypeScript', 'Node.js', 'Hono', 'DynamoDB'],
    frontend: ['React', 'Vite'],
  },
  metadata: {
    github: 'https://github.com/tedeuxx',
    website: 'https://tadeumendonca.io',
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
