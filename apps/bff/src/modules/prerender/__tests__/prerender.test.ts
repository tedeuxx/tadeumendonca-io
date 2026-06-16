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

  it('returns JSON meta for a published post', async () => {
    send.mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'My Post', body: '# Hi\n\nbody text', published: true, tags: ['aws'], created_at: '2026-06-01T00:00:00.000Z' } });
    const res = await app.request('/og-meta/posts/p1');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; image_url: string; url: string };
    expect(body.title).toBe('My Post');
    expect(body.image_url).toMatch(/\/og\/posts\/p1\.png$/);
    expect(body.url).toMatch(/\/posts\/p1$/);
  });

  it('404s a draft post', async () => {
    send.mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'X', body: 'b', published: false, created_at: 'x' } });
    const res = await app.request('/og-meta/posts/p1');
    expect(res.status).toBe(404);
  });

  it('resolves a /p/<code> short link to the post meta', async () => {
    send
      .mockResolvedValueOnce({ Item: { code: 'abc1234', type: 'post', target_id: 'p1', created_at: 't' } }) // resolveCode
      .mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'My Post', body: 'b', published: true, created_at: '2026-06-01T00:00:00.000Z' } }); // getPost
    const res = await app.request('/og-meta/p/abc1234');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; url: string };
    expect(body.title).toBe('My Post');
    expect(body.url).toMatch(/\/posts\/p1$/); // canonical URL is the post, not the short link
  });

  it('404s an unknown short code', async () => {
    send.mockResolvedValueOnce({}); // resolveCode → none
    const res = await app.request('/og-meta/p/zzzzzzz');
    expect(res.status).toBe(404);
  });

  it('404s for an unsupported type', async () => {
    const res = await app.request('/og-meta/unknown/whatever');
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

  it('returns indexable HTML with BlogPosting JSON-LD for a published post', async () => {
    send.mockResolvedValueOnce({ Item: { post_id: 'p1', title: 'My Post', body: '# Hi\n\nbody', published: true, created_at: '2026-06-01T00:00:00.000Z' } });
    const res = await app.request('/prerender/posts/p1');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('My Post');
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('og:type" content="article"');
  });

  it('404s when the profile is absent', async () => {
    send.mockResolvedValueOnce({});
    const res = await app.request('/prerender/profile/me');
    expect(res.status).toBe(404);
  });

  it('404s for an unsupported type', async () => {
    const res = await app.request('/prerender/unknown/x');
    expect(res.status).toBe(404);
  });
});
