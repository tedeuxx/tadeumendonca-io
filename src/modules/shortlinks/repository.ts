// Short-link repository (/backend/dynamodb). Maps an opaque base62 code → a post, for share URLs
// (tadeumendonca.io/p/<code>). Codes are generated with a conditional Put so collisions can't clobber
// an existing link (retried a few times; 62^7 ≈ 3.5e12 keyspace makes collisions vanishingly rare).
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { customAlphabet } from 'nanoid';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { ShortLink } from '../../shared/types/entities';

const newCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);

// Create a unique short link for a post; returns the code. Retries on the (rare) collision.
export async function createShortLink(target_id: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const link: ShortLink = { code, type: 'post', target_id, created_at: new Date().toISOString() };
    try {
      await ddb.send(new PutCommand({ TableName: TABLES.shortlinks, Item: link, ConditionExpression: 'attribute_not_exists(code)' }));
      return code;
    } catch (err) {
      if ((err as { name?: string }).name !== 'ConditionalCheckFailedException') throw err;
      // collision → loop and try a new code
    }
  }
  throw new Error('could not allocate a unique short code');
}

export async function resolveCode(code: string): Promise<ShortLink | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.shortlinks, Key: { code } }));
  return (res.Item as ShortLink | undefined) ?? null;
}
