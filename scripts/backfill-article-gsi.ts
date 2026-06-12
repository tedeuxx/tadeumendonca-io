// One-off migration: stamp gsi_pk = "ARTICLE" on already-published articles so they show up in the new
// sparse by-created GSI (drafts stay out — no gsi_pk). Idempotent (skips already-stamped). Run AFTER the
// GSI exists (iac) with the articles table name + admin AWS creds that allow Scan + UpdateItem:
//   ARTICLES_TABLE_NAME=tadeumendonca-articles-staging AWS_REGION=us-east-1 npx tsx scripts/backfill-article-gsi.ts
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../src/shared/db/client';
import { ARTICLE_FEED_PK, type Article } from '../src/shared/types/entities';

const table = process.env.ARTICLES_TABLE_NAME;
if (!table) throw new Error('ARTICLES_TABLE_NAME is required');

let scanned = 0;
let stamped = 0;
let ExclusiveStartKey: Record<string, unknown> | undefined;
do {
  const res = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey }));
  for (const a of ((res.Items as Article[] | undefined) ?? [])) {
    scanned++;
    if (a.published && a.gsi_pk !== ARTICLE_FEED_PK) {
      await ddb.send(
        new UpdateCommand({
          TableName: table,
          Key: { article_id: a.article_id },
          UpdateExpression: 'SET gsi_pk = :pk',
          ExpressionAttributeValues: { ':pk': ARTICLE_FEED_PK },
        }),
      );
      stamped++;
      console.log(`stamped ${a.article_id} (${a.slug})`);
    }
  }
  ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
} while (ExclusiveStartKey);

console.log(`done: scanned ${scanned} article(s), stamped ${stamped}`);
