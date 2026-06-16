// Users repository (/backend/dynamodb). One item per signed-in user, keyed by the Cognito sub. The
// item is created lazily on the first PUT /me. The sparse by-digest GSI key (`digest_schedule`) is set
// only while opted in, so the digest Lambda Queries opted-in users by cadence without a Scan.
import { GetCommand, PutCommand, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { User, DigestSchedule } from '../../shared/types/entities';

export async function getUser(cognito_sub: string): Promise<User | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.users, Key: { cognito_sub } }));
  return (res.Item as User | undefined) ?? null;
}

export async function saveUser(user: User): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.users, Item: user }));
}

// Resolve avatar keys for a set of Cognito subs (read-time enrichment for comments, so an avatar change
// reflects everywhere immediately — nothing is denormalized onto the comment). One BatchGetItem; only
// subs that have an avatar land in the map. Caps at 100 keys (BatchGetItem limit) — a comment page is ≤50.
export async function getAvatarKeysBySub(subs: string[]): Promise<Map<string, string>> {
  const keys = [...new Set(subs)].slice(0, 100).map((cognito_sub) => ({ cognito_sub }));
  if (keys.length === 0) return new Map();
  const res = await ddb.send(
    new BatchGetCommand({
      RequestItems: { [TABLES.users]: { Keys: keys, ProjectionExpression: 'cognito_sub, avatar_key' } },
    }),
  );
  const map = new Map<string, string>();
  for (const item of (res.Responses?.[TABLES.users] as User[] | undefined) ?? []) {
    if (item.avatar_key) map.set(item.cognito_sub, item.avatar_key);
  }
  return map;
}

// Opted-in users for a cadence, via the SPARSE `by-digest` GSI (hash = digest_schedule). Only opted-in
// users carry the key, so this never returns opted-out users and never Scans. Paginated for completeness.
export async function listByDigestSchedule(schedule: DigestSchedule): Promise<User[]> {
  const users: User[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.users,
        IndexName: 'by-digest',
        KeyConditionExpression: 'digest_schedule = :s',
        ExpressionAttributeValues: { ':s': schedule },
        ExclusiveStartKey,
      }),
    );
    users.push(...((res.Items as User[] | undefined) ?? []));
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return users;
}
