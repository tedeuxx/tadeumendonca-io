// One-off backfill (Phase 4): convert legacy markdown article bodies → sanitized HTML and set
// content_format='html', so every article uses the same rich-HTML render path as the new editor.
// IDEMPOTENT: items already content_format==='html' are skipped. Uses a Scan (admin tooling — NOT the
// request path, which never Scans) to reach drafts too (the by-created GSI is published-only). Run with:
//   ARTICLES_TABLE_NAME=tadeumendonca-articles-staging AWS_REGION=us-east-1 npx tsx scripts/migrate-articles-to-html.ts
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../src/shared/db/client';
import { renderMarkdown } from '../src/shared/render';
import { sanitizeArticleHtml } from '../src/shared/render/sanitize';
import type { Article } from '../src/shared/types/entities';

const articlesTable = process.env.ARTICLES_TABLE_NAME;
if (!articlesTable) throw new Error('ARTICLES_TABLE_NAME is required');

async function* allArticles(): AsyncGenerator<Article> {
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: articlesTable, ExclusiveStartKey }));
    for (const item of (res.Items as Article[] | undefined) ?? []) yield item;
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
}

let converted = 0;
let skipped = 0;
for await (const article of allArticles()) {
  if (article.content_format === 'html') {
    skipped++;
    continue;
  }
  const body = sanitizeArticleHtml(renderMarkdown(article.body)); // markdown → HTML → sanitize
  await ddb.send(new PutCommand({ TableName: articlesTable, Item: { ...article, body, content_format: 'html' } }));
  converted++;
  console.log(`converted: ${article.slug}`);
}
console.log(`done — converted ${converted}, skipped ${skipped} (already html)`);
