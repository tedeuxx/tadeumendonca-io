// Posts repository (/backend/dynamodb). Feed reads use the sparse `by-created` GSI (gsi_pk = "POST",
// created_at desc) — no Scan. Cursor pagination is base64(LastEvaluatedKey). Writes set/clear gsi_pk
// from `published` so drafts stay out of the feed index.
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import { FEED_PK, type Post } from '../../shared/types/entities';

export interface Page {
  items: Post[];
  next_cursor?: string;
}

const encodeCursor = (key?: Record<string, unknown>): string | undefined =>
  key ? Buffer.from(JSON.stringify(key)).toString('base64url') : undefined;

const decodeCursor = (cursor?: string): Record<string, unknown> | undefined =>
  cursor ? JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) : undefined;

// Public feed: published posts, newest first, cursor-paginated.
export async function listPublished(limit: number, cursor?: string): Promise<Page> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.posts,
      IndexName: 'by-created',
      KeyConditionExpression: 'gsi_pk = :pk',
      ExpressionAttributeValues: { ':pk': FEED_PK },
      ScanIndexForward: false, // created_at desc
      Limit: limit,
      ExclusiveStartKey: decodeCursor(cursor),
    }),
  );
  return { items: (res.Items as Post[]) ?? [], next_cursor: encodeCursor(res.LastEvaluatedKey) };
}

export async function getPost(post_id: string): Promise<Post | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.posts, Key: { post_id } }));
  return (res.Item as Post | undefined) ?? null;
}

// Create — fails if the id already exists (idempotency guard; ids are generated so collisions ≈ never).
export async function createPost(post: Post): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLES.posts,
      Item: post,
      ConditionExpression: 'attribute_not_exists(post_id)',
    }),
  );
}

// Overwrite an existing item (the route merges + revalidates before calling this).
export async function savePost(post: Post): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.posts, Item: post }));
}

export async function deletePost(post_id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.posts, Key: { post_id } }));
}
