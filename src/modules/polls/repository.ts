// Polls repository (/backend/dynamodb). Reads via the sparse by-created GSI (gsi_pk = "POLL" iff
// published), so listing published polls newest-first is a Query — NEVER a Scan (which reads the whole
// table and which the BFF role doesn't grant). Votes are atomic ADDs onto a vote_counts map
// denormalized on the poll item (public, anonymous; the SPA dedupes one-per-browser via localStorage),
// so there is no separate votes table.
import { QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import { POLL_FEED_PK, type Poll } from '../../shared/types/entities';
import { NotFoundError } from '../../shared/errors/http-errors';

export interface Page {
  items: Poll[];
  next_cursor?: string;
}

const enc = (k?: Record<string, unknown>): string | undefined => (k ? Buffer.from(JSON.stringify(k)).toString('base64url') : undefined);
const dec = (c?: string): Record<string, unknown> | undefined => (c ? JSON.parse(Buffer.from(c, 'base64url').toString('utf8')) : undefined);

// Public list — published polls newest-first via the sparse by-created GSI (no Scan).
export async function listPublished(limit: number, cursor?: string): Promise<Page> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.polls,
      IndexName: 'by-created',
      KeyConditionExpression: 'gsi_pk = :pk',
      ExpressionAttributeValues: { ':pk': POLL_FEED_PK },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: dec(cursor),
    }),
  );
  return { items: (res.Items as Poll[]) ?? [], next_cursor: enc(res.LastEvaluatedKey) };
}

export async function getById(poll_id: string): Promise<Poll | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.polls, Key: { poll_id } }));
  return (res.Item as Poll | undefined) ?? null;
}

export async function createPoll(poll: Poll): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.polls, Item: poll, ConditionExpression: 'attribute_not_exists(poll_id)' }));
}

export async function savePoll(poll: Poll): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.polls, Item: poll }));
}

export async function deletePoll(poll_id: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.polls, Key: { poll_id } }));
}

// Record one anonymous vote — atomic ADD on vote_counts.<option_id>, returning the updated counts. We
// first ensure the map (and the poll) exist so ADD on the nested path can't fail on a poll created
// before it had any votes; the conditional guards against voting on a deleted poll.
export async function recordVote(poll_id: string, option_id: string): Promise<Record<string, number>> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.polls,
        Key: { poll_id },
        UpdateExpression: 'SET vote_counts = if_not_exists(vote_counts, :empty)',
        ExpressionAttributeValues: { ':empty': {} },
        ConditionExpression: 'attribute_exists(poll_id)',
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') throw new NotFoundError('poll not found');
    throw err;
  }
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.polls,
      Key: { poll_id },
      UpdateExpression: 'ADD vote_counts.#o :d',
      ExpressionAttributeNames: { '#o': option_id },
      ExpressionAttributeValues: { ':d': 1 },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return (res.Attributes?.vote_counts as Record<string, number> | undefined) ?? {};
}
