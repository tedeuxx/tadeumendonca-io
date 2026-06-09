// Articles repository (/backend/dynamodb). Reads: by-slug GSI (public URL), by-tag GSI (category feed,
// newest-first). The "list all" path Scans — articles are long-form + low-volume, so a filtered Scan is
// acceptable here (NOT a hot path); if volume grows, add a constant-partition GSI like posts' by-created.
// Drafts are excluded by a published filter, never returned to the public.
import { QueryCommand, ScanCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { Article } from '../../shared/types/entities';

export interface Page {
  items: Article[];
  next_cursor?: string;
}

const enc = (k?: Record<string, unknown>): string | undefined => (k ? Buffer.from(JSON.stringify(k)).toString('base64url') : undefined);
const dec = (c?: string): Record<string, unknown> | undefined => (c ? JSON.parse(Buffer.from(c, 'base64url').toString('utf8')) : undefined);

// Public list — newest-first. With a tag → the by-tag GSI; without → a published-filtered Scan.
export async function listPublished(limit: number, cursor?: string, tag?: string): Promise<Page> {
  if (tag) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.articles,
        IndexName: 'by-tag',
        KeyConditionExpression: '#t = :t',
        FilterExpression: 'published = :p',
        ExpressionAttributeNames: { '#t': 'tag' },
        ExpressionAttributeValues: { ':t': tag, ':p': true },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: dec(cursor),
      }),
    );
    return { items: (res.Items as Article[]) ?? [], next_cursor: enc(res.LastEvaluatedKey) };
  }
  const res = await ddb.send(
    new ScanCommand({
      TableName: TABLES.articles,
      FilterExpression: 'published = :p',
      ExpressionAttributeValues: { ':p': true },
      Limit: limit,
      ExclusiveStartKey: dec(cursor),
    }),
  );
  const items = ((res.Items as Article[]) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { items, next_cursor: enc(res.LastEvaluatedKey) };
}

export async function getBySlug(slug: string): Promise<Article | null> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.articles,
      IndexName: 'by-slug',
      KeyConditionExpression: 'slug = :s',
      ExpressionAttributeValues: { ':s': slug },
      Limit: 1,
    }),
  );
  return ((res.Items as Article[] | undefined)?.[0]) ?? null;
}

export async function getById(article_id: string): Promise<Article | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.articles, Key: { article_id } }));
  return (res.Item as Article | undefined) ?? null;
}

export async function createArticle(article: Article): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.articles, Item: article, ConditionExpression: 'attribute_not_exists(article_id)' }));
}

export async function saveArticle(article: Article): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.articles, Item: article }));
}

export async function deleteArticle(article_id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.articles, Key: { article_id } }));
}
