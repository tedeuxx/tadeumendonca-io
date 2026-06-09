// Subscriptions repository (/backend/dynamodb, /backend/notifications). Hash key = email (one row per
// address, upsert = idempotent). The `by-status` GSI lists active subscribers for the fan-out — Query,
// never Scan. Unsubscribe is a SOFT delete (status='unsubscribed') so the address isn't silently
// re-added and we honor the opt-out.
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { Subscription } from '../../shared/types/entities';

export async function upsertSubscription(sub: Subscription): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.subscriptions, Item: sub }));
}

// Soft unsubscribe — flip status to 'unsubscribed' (no-op if the row is absent is acceptable here).
export async function unsubscribe(email: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.subscriptions,
      Key: { email },
      UpdateExpression: 'SET #s = :u, updated_at = :t',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':u': 'unsubscribed', ':t': new Date().toISOString() },
    }),
  );
}

// Active subscribers, paged internally — used by the notification fan-out.
export async function listActiveEmails(): Promise<string[]> {
  const emails: string[] = [];
  let cursor: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.subscriptions,
        IndexName: 'by-status',
        KeyConditionExpression: '#s = :a',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':a': 'active' },
        ProjectionExpression: 'email',
        ExclusiveStartKey: cursor,
      }),
    );
    for (const item of (res.Items as Array<{ email: string }>) ?? []) emails.push(item.email);
    cursor = res.LastEvaluatedKey;
  } while (cursor);
  return emails;
}
