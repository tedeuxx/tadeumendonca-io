// Runtime secret access (/backend/secrets-management). Sensitive third-party credentials are NOT shipped
// in env vars — IaC injects only the secret ARN and the BFF fetches the value here on first use, caching
// it in memory for the warm-container lifetime (rotation is picked up on the next cold start). The IAM
// role grants secretsmanager:GetSecretValue scoped to <project>/<env>/* (api.tf read_secrets).
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({}); // module-level, reused across invocations
const cache = new Map<string, unknown>();

// Fetch and cache a JSON secret by its ARN. Throws if the ARN is unset (misconfigured deployment) or
// the secret holds no value.
export async function getSecret<T>(secretArn: string): Promise<T> {
  if (!secretArn) throw new Error('secret ARN is not configured');
  const hit = cache.get(secretArn);
  if (hit !== undefined) return hit as T;
  const { SecretString } = await sm.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!SecretString) throw new Error(`secret has no value: ${secretArn}`);
  const value = JSON.parse(SecretString) as T;
  cache.set(secretArn, value); // cache for the warm container lifetime
  return value;
}
