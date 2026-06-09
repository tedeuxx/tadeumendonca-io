// Profile repository — DynamoDB access for the single CV item (profile_id = "me"). Get only in
// Phase 1 (the profile is seeded; admin edits land later). No Scan (/backend/dynamodb).
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { Profile } from '../../shared/types/entities';

export const PROFILE_ID = 'me';

export async function getProfile(): Promise<Profile | null> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.profile, Key: { profile_id: PROFILE_ID } }),
  );
  return (res.Item as Profile | undefined) ?? null;
}
