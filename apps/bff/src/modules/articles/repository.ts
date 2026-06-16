// Articles repository (/backend/dynamodb). Reads: by-slug GSI (public URL), by-tag GSI (category feed,
// newest-first), by-created GSI (public list + unified feed). by-created is SPARSE (gsi_pk = "ARTICLE"
// iff published), so listing published articles newest-first is a Query — NEVER a Scan (which reads the
// whole table; cost/latency scale with table size, not the result — and the BFF role grants no Scan).
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import { ARTICLE_FEED_PK, type Article } from '../../shared/types/entities';

export interface Page {
  items: Article[];
  next_cursor?: string;
}

const enc = (k?: Record<string, unknown>): string | undefined => (k ? Buffer.from(JSON.stringify(k)).toString('base64url') : undefined);
const dec = (c?: string): Record<string, unknown> | undefined => (c ? JSON.parse(Buffer.from(c, 'base64url').toString('utf8')) : undefined);

// Public list — newest-first. With a tag → the by-tag GSI (published-filtered, since tag is set on
// drafts too); without → the sparse by-created GSI (already published-only, sorted by created_at).
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
    new QueryCommand({
      TableName: TABLES.articles,
      IndexName: 'by-created',
      KeyConditionExpression: 'gsi_pk = :pk',
      ExpressionAttributeValues: { ':pk': ARTICLE_FEED_PK },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: dec(cursor),
    }),
  );
  return { items: (res.Items as Article[]) ?? [], next_cursor: enc(res.LastEvaluatedKey) };
}

// All published articles (drained across pages), newest-first — for the unified feed merge. Queries the
// sparse by-created GSI (no Scan). Low-volume table, so loading the full set in memory is acceptable.
export async function listAllPublished(): Promise<Article[]> {
  const items: Article[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.articles,
        IndexName: 'by-created',
        KeyConditionExpression: 'gsi_pk = :pk',
        ExpressionAttributeValues: { ':pk': ARTICLE_FEED_PK },
        ScanIndexForward: false,
        ExclusiveStartKey,
      }),
    );
    items.push(...((res.Items as Article[]) ?? []));
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
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
