// One-off: seed the profile table item (profile_id="me"). Run with the profile table name in env
// and AWS creds that allow dynamodb:PutItem on it. Idempotent (overwrites the single item).
//   PROFILE_TABLE_NAME=tadeumendonca-profile-staging npx tsx scripts/seed.ts
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../src/shared/db/client';
import type { Profile } from '../src/shared/types/entities';

const table = process.env.PROFILE_TABLE_NAME;
if (!table) throw new Error('PROFILE_TABLE_NAME is required');

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

await ddb.send(new PutCommand({ TableName: table, Item: profile }));
console.log(`seeded profile into ${table}`);
