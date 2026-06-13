// Users repository (/backend/dynamodb). One item per signed-in user, keyed by the Cognito sub. The
// item is created lazily on the first PUT /me. The sparse by-digest GSI key (`digest_schedule`) is set
// only while opted in, so the digest Lambda Queries opted-in users by cadence without a Scan.
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { User } from '../../shared/types/entities';

export async function getUser(cognito_sub: string): Promise<User | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.users, Key: { cognito_sub } }));
  return (res.Item as User | undefined) ?? null;
}

export async function saveUser(user: User): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.users, Item: user }));
}
