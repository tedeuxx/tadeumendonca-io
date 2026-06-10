// Comments repository (/backend/dynamodb). Comments are post-moderated: stored public on write, removed
// by the author or an admin. The by-post GSI lists a post's comments oldest-first, cursor-paginated.
// comment_count is denormalized on the post item (atomic ADD) so the feed shows it without a join.
import { QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { Comment } from '../../shared/types/entities';

export interface CommentPage {
  items: Comment[];
  next_cursor?: string;
}

const encodeCursor = (key?: Record<string, unknown>): string | undefined => (key ? Buffer.from(JSON.stringify(key)).toString('base64url') : undefined);
const decodeCursor = (cursor?: string): Record<string, unknown> | undefined => (cursor ? JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) : undefined);

export async function listByPost(post_id: string, limit: number, cursor?: string): Promise<CommentPage> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.comments,
      IndexName: 'by-post',
      KeyConditionExpression: 'post_id = :p',
      ExpressionAttributeValues: { ':p': post_id },
      ScanIndexForward: true, // created_at asc — oldest first
      Limit: limit,
      ExclusiveStartKey: decodeCursor(cursor),
    }),
  );
  return { items: (res.Items as Comment[]) ?? [], next_cursor: encodeCursor(res.LastEvaluatedKey) };
}

export async function getComment(comment_id: string): Promise<Comment | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.comments, Key: { comment_id } }));
  return (res.Item as Comment | undefined) ?? null;
}

export async function addComment(comment: Comment): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.comments, Item: comment }));
  await bumpCommentCount(comment.post_id, 1);
}

export async function deleteComment(comment_id: string, post_id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.comments, Key: { comment_id } }));
  await bumpCommentCount(post_id, -1);
}

// Denormalized counter on the post. Best-effort: a missing post just means no-op (guarded).
async function bumpCommentCount(post_id: string, delta: 1 | -1): Promise<void> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.posts,
        Key: { post_id },
        UpdateExpression: 'ADD comment_count :d',
        ExpressionAttributeValues: { ':d': delta },
        ConditionExpression: 'attribute_exists(post_id)',
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name !== 'ConditionalCheckFailedException') throw err;
  }
}
