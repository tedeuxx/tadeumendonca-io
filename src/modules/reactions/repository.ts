// Reactions repository (/backend/dynamodb). Reactions are PUBLIC vanity counts stored DENORMALIZED on
// the post item (a reaction_counts map) — no separate table, and the feed gets the counts for free.
// The update is atomic (DynamoDB ADD); we first ensure the map exists (and the post exists) so ADD on
// the nested path can't fail on older items.
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import { NotFoundError } from '../../shared/errors/http-errors';

export async function applyReaction(post_id: string, emoji: string, delta: 1 | -1): Promise<Record<string, number>> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.posts,
        Key: { post_id },
        UpdateExpression: 'SET reaction_counts = if_not_exists(reaction_counts, :empty)',
        ExpressionAttributeValues: { ':empty': {} },
        ConditionExpression: 'attribute_exists(post_id)',
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') throw new NotFoundError('post not found');
    throw err;
  }
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.posts,
      Key: { post_id },
      UpdateExpression: 'ADD reaction_counts.#e :d',
      ExpressionAttributeNames: { '#e': emoji },
      ExpressionAttributeValues: { ':d': delta },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return (res.Attributes?.reaction_counts as Record<string, number> | undefined) ?? {};
}
