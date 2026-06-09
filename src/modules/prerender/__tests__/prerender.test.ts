import { describe, it, expect, vi, afterEach } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../shared/db/client', () => ({ ddb: { send } }));

import { app } from '../../../index';

const profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Software Engineer',
  summary: 'Builds serverless products.',
  experience: [{ company: 'x', title: 'Eng', start_date: '2026', end_date: null }],
  education: [],
  certifications: [],
  skills: { cloud: ['AWS'] },
  metadata: { github: 'https://github.com/tedeuxx' },
};

afterEach(() => vi.clearAllMocks());

describe('prerender — og-meta', () => {
  it('returns JSON meta for the profile', async () => {
    send.mockResolvedValueOnce({ Item: profile });
    const res = await app.request('/og-meta/profile/me');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; image_url: string; url: string };
    expect(body.title).toContain('Tadeu Mendonça');
    expect(body.image_url).toMatch(/\/og\/profile\/me\.png$/);
  });

  it('404s for an unsupported type', async () => {
    const res = await app.request('/og-meta/posts/whatever');
    expect(res.status).toBe(404);
  });

  it('404s when the profile is absent', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/og-meta/profile/me');
    expect(res.status).toBe(404);
  });
});

describe('prerender — full HTML', () => {
  it('returns indexable HTML with JSON-LD for the profile', async () => {
    send.mockResolvedValueOnce({ Item: profile });
    const res = await app.request('/prerender/profile/me');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Tadeu Mendonça');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('Experience');
  });

  it('404s when the profile is absent', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/prerender/profile/me');
    expect(res.status).toBe(404);
  });

  it('404s for an unsupported type', async () => {
    const res = await app.request('/prerender/articles/x');
    expect(res.status).toBe(404);
  });
});
