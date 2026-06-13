// Short-link repository (/backend/dynamodb). Maps an opaque base62 code → a post, for share URLs
// (tadeumendonca.io/p/<code>). Codes are generated with a conditional Put so collisions can't clobber
// an existing link (retried a few times; 62^7 ≈ 3.5e12 keyspace makes collisions vanishingly rare).
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { customAlphabet } from 'nanoid';
import { ddb } from '../../shared/db/client';
import { TABLES } from '../../shared/db/tables';
import type { ShortLink } from '../../shared/types/entities';

const newCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);

// Create a unique short link for a post (target_id = post_id) or article (target_id = slug); returns
// the code. Retries on the (rare) collision.
export async function createShortLink(target_id: string, type: ShortLink['type'] = 'post'): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const link: ShortLink = { code, type, target_id, created_at: new Date().toISOString() };
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

// Repoint an existing code at a new target — used when an article's slug changes, so already-shared
// /p/<code> links keep resolving. No-op-safe: the condition skips a code that no longer exists.
export async function repointShortLink(code: string, target_id: string): Promise<void> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.shortlinks,
        Key: { code },
        UpdateExpression: 'SET target_id = :t',
        ConditionExpression: 'attribute_exists(code)',
        ExpressionAttributeValues: { ':t': target_id },
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name !== 'ConditionalCheckFailedException') throw err;
    // code vanished (deleted) → nothing to repoint
  }
}

export async function resolveCode(code: string): Promise<ShortLink | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.shortlinks, Key: { code } }));
  return (res.Item as ShortLink | undefined) ?? null;
}
