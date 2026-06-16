import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the DynamoDB client at the module boundary (/backend/framework-hono testing).
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const sampleProfile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Software Engineer',
  experience: [],
  education: [],
  certifications: [],
  skills: {},
  metadata: {},
};

afterEach(() => vi.clearAllMocks());

describe('GET /profile', () => {
  it('returns the profile when present', async () => {
    send.mockResolvedValueOnce({ Item: sampleProfile });
    const res = await app.request('/profile');
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof sampleProfile;
    expect(body.name).toBe('Tadeu Mendonça');
    expect(body.profile_id).toBe('me');
  });

  it('returns 404 with a snake_case error body when absent', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/profile');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });

  it('returns 500 on an unexpected repository error', async () => {
    send.mockRejectedValueOnce(new Error('boom'));
    const res = await app.request('/profile');
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('internal_error');
  });
});

describe('GET /health', () => {
  it('is ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});
