// Posts repository (/backend/dynamodb). Feed reads use the sparse `by-created` GSI (gsi_pk = "POST",
// created_at desc) — no Scan; the unified feed (see ./feed.ts) range-queries it by a created_at cursor.
// Writes set/clear gsi_pk from `published` so drafts stay out of the feed index.
import { QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import { FEED_PK, type Post } from '../../shared/types/entities';

// Feed posts older than `before` (exclusive), newest-first — backs the unified feed's timestamp cursor.
// The by-created GSI sort key is created_at, so the range condition is a key query (no Scan/filter).
export async function listFeedPostsBefore(limit: number, before?: string): Promise<Post[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.posts,
      IndexName: 'by-created',
      KeyConditionExpression: before ? 'gsi_pk = :pk AND created_at < :before' : 'gsi_pk = :pk',
      ExpressionAttributeValues: before ? { ':pk': FEED_PK, ':before': before } : { ':pk': FEED_PK },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return (res.Items as Post[]) ?? [];
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
