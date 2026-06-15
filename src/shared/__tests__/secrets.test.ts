import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SDK so getSecret is hermetic (no AWS). send is the SecretsManagerClient.send spy.
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => ({ send })),
  GetSecretValueCommand: vi.fn((input: unknown) => ({ input })),
}));

import { getSecret } from '../secrets';

beforeEach(() => vi.clearAllMocks());

describe('getSecret', () => {
  it('throws when the ARN is not configured (misconfigured deployment)', async () => {
    await expect(getSecret('')).rejects.toThrow('not configured');
    expect(send).not.toHaveBeenCalled();
  });

  it('fetches + parses the JSON value and caches it by ARN (no second SDK call)', async () => {
    send.mockResolvedValueOnce({ SecretString: JSON.stringify({ api_key: 'k' }) });
    const arn = 'arn:aws:secretsmanager:us-east-1:1:secret:giphy-A';
    const first = await getSecret<{ api_key: string }>(arn);
    expect(first.api_key).toBe('k');
    const second = await getSecret<{ api_key: string }>(arn); // served from cache
    expect(second.api_key).toBe('k');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('throws when the secret holds no value', async () => {
    send.mockResolvedValueOnce({ SecretString: undefined });
    await expect(getSecret('arn:aws:secretsmanager:us-east-1:1:secret:empty-B')).rejects.toThrow('no value');
  });
});
