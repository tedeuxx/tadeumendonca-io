import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup }));
const { objectExists, putImage } = vi.hoisted(() => ({ objectExists: vi.fn(), putImage: vi.fn() }));
vi.mock('../../../shared/s3/client', () => ({ objectExists, putImage }));

import { parseOg } from '../og';
import { safeFetch } from '../ssrf';
import { resolveUrl } from '../resolve';

beforeEach(() => {
  lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  objectExists.mockResolvedValue(false);
  putImage.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function streamResponse({ status = 200, contentType = 'text/html', body = '', location }: { status?: number; contentType?: string; body?: string; location?: string }) {
  const bytes = new TextEncoder().encode(body);
  return {
    status,
    headers: { get: (k: string) => (k === 'content-type' ? contentType : k === 'location' ? location ?? null : null) },
    body: {
      getReader() {
        let done = false;
        return {
          read: async () => (done ? { done: true, value: undefined } : ((done = true), { done: false, value: bytes })),
          cancel: async () => undefined,
        };
      },
    },
  };
}

describe('og decode', () => {
  it('decodes numeric (dec + hex) entities and leaves unknown ones', () => {
    const og = parseOg('<meta property="og:title" content="A&#10003;B&#x2764;C&unknownent;D">');
    expect(og.title).toBe('A✓B❤C&unknownent;D');
  });
  it('returns empty fields when no meta present', () => {
    expect(parseOg('<html><body>nothing</body></html>')).toEqual({ title: undefined, description: undefined, image: undefined, site_name: undefined, author: undefined });
  });
});

describe('SSRF IP ranges', () => {
  const cases: [string, { address: string; family: number }][] = [
    ['172.16.0.1', { address: '172.16.0.1', family: 4 }],
    ['192.168.1.1', { address: '192.168.1.1', family: 4 }],
    ['100.64.0.1 (CGNAT)', { address: '100.64.0.1', family: 4 }],
    ['224.0.0.1 (multicast)', { address: '224.0.0.1', family: 4 }],
    ['malformed v4', { address: '999.1.1.1', family: 4 }],
    ['::1 (v6 loopback)', { address: '::1', family: 6 }],
    ['fe80 link-local', { address: 'fe80::1', family: 6 }],
    ['fd00 ULA', { address: 'fd00::1', family: 6 }],
    ['v4-mapped private', { address: '::ffff:10.0.0.1', family: 6 }],
  ];
  for (const [name, addr] of cases) {
    it(`blocks ${name}`, async () => {
      lookup.mockResolvedValueOnce([addr]);
      await expect(safeFetch('https://host.example', { maxBytes: 100 })).rejects.toThrow();
    });
  }

  it('blocks a .internal host by name', async () => {
    await expect(safeFetch('https://db.internal', { maxBytes: 100 })).rejects.toThrow(/not allowed/);
  });
  it('throws when the host does not resolve', async () => {
    lookup.mockResolvedValueOnce([]);
    await expect(safeFetch('https://ghost.example', { maxBytes: 100 })).rejects.toThrow(/does not resolve/);
  });
  it('throws when DNS lookup fails', async () => {
    lookup.mockRejectedValueOnce(new Error('nxdomain'));
    await expect(safeFetch('https://broken.example', { maxBytes: 100 })).rejects.toThrow(/does not resolve/);
  });
});

describe('safeFetch transport', () => {
  it('follows a redirect to another public host', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(streamResponse({ status: 302, location: 'https://final.example/x' }))
      .mockResolvedValueOnce(streamResponse({ body: 'arrived' }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await safeFetch('https://start.example', { maxBytes: 100 });
    expect(new TextDecoder().decode(res.bytes)).toBe('arrived');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('truncates a body larger than the byte cap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse({ body: 'hello world' })));
    const res = await safeFetch('https://big.example', { maxBytes: 3 });
    expect(res.bytes.length).toBe(3);
  });

  it('rejects after too many redirects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse({ status: 302, location: 'https://loop.example/next' })));
    await expect(safeFetch('https://loop.example', { maxBytes: 100, timeoutMs: 2000 })).rejects.toThrow(/too many redirects/);
  });
});

describe('resolveUrl providers', () => {
  it('resolves Spotify via oEmbed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(streamResponse({ contentType: 'application/json', body: JSON.stringify({ title: 'Track', provider_name: 'Spotify' }) })));
    const p = await resolveUrl('https://open.spotify.com/track/abc');
    expect(p.provider).toBe('Spotify');
    expect(p.title).toBe('Track');
    expect(p.image).toBeUndefined(); // no thumbnail_url
  });

  it('returns a degraded card for Instagram', async () => {
    const p = await resolveUrl('https://www.instagram.com/p/abc/');
    expect(p.provider).toBe('Instagram');
    expect(p.title).toMatch(/View on Instagram/);
  });

  it('handles a non-HTML generic URL gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(streamResponse({ contentType: 'application/pdf', body: '%PDF' })));
    const p = await resolveUrl('https://files.example.com/doc.pdf');
    expect(p.provider).toBe('web');
    expect(p.title).toBeUndefined();
    expect(p.site_name).toBe('files.example.com');
  });

  it('drops a thumbnail that is not an image content-type', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(streamResponse({ contentType: 'text/html', body: '<meta property="og:title" content="T"><meta property="og:image" content="https://x.example/notimg">' }))
      .mockResolvedValueOnce(streamResponse({ contentType: 'text/plain', body: 'nope' }));
    vi.stubGlobal('fetch', fetchMock);
    const p = await resolveUrl('https://site.example/a');
    expect(p.title).toBe('T');
    expect(p.image).toBeUndefined();
    expect(putImage).not.toHaveBeenCalled();
  });
});
