// Cognito email resolution for the digest (/backend/notifications). The users table is keyed by the
// Cognito sub and stores NO email (the SPA's access token doesn't carry one), so Cognito is the
// authoritative source. We ListUsers ONCE per run (paginated) and build a sub -> email map, rather than
// N AdminGetUser calls. IAM: cognito-idp:ListUsers, scoped to this env's pool (api.tf fn_digest).
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({}); // region/creds from the Lambda runtime
const poolId = (): string => process.env.COGNITO_USER_POOL_ID ?? '';

// Map every pool user's Cognito sub -> verified email. Users without a sub or email are skipped.
export async function buildSubEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let PaginationToken: string | undefined;
  do {
    const res = await cognito.send(
      new ListUsersCommand({ UserPoolId: poolId(), AttributesToGet: ['sub', 'email'], PaginationToken }),
    );
    for (const user of res.Users ?? []) {
      const attrs = user.Attributes ?? [];
      const sub = attrs.find((a) => a.Name === 'sub')?.Value;
      const email = attrs.find((a) => a.Name === 'email')?.Value;
      if (sub && email) map.set(sub, email);
    }
    PaginationToken = res.PaginationToken;
  } while (PaginationToken);
  return map;
}
