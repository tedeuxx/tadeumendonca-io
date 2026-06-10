import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Mock DNS so SSRF resolution is deterministic (default: a public IP).
const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup }));

// Mock S3 cache so thumbnail caching doesn't hit AWS.
const { objectExists, putImage } = vi.hoisted(() => ({ objectExists: vi.fn(), putImage: vi.fn() }));
vi.mock('../../../shared/s3/client', () => ({ objectExists, putImage }));

import { parseOg } from '../og';
import { parseSafeUrl, safeFetch } from '../ssrf';
import { resolveUrl, extractUrls } from '../resolve';

beforeEach(() => {
  lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]); // public (example.com)
  objectExists.mockResolvedValue(false);
  putImage.mockResolvedValue(undefined);
});
afterEach(() => vi.clearAllMocks());

// Build a fetch Response-like with a streaming body (safeFetch reads via getReader()).
function mockResponse({ status = 200, contentType = 'text/html', body = '', location }: { status?: number; contentType?: string; body?: string; location?: string }) {
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

describe('parseOg', () => {
  it('extracts og + twitter fields and decodes entities', () => {
    const og = parseOg(`<head>
      <meta property="og:title" content="Hello &amp; World">
      <meta name="twitter:description" content="A &#39;quoted&#39; desc">
      <meta property="og:image" content="https://cdn.example.com/x.jpg">
      <meta property="og:site_name" content="Example">
      <title>fallback</title>
    </head>`);
    expect(og.title).toBe('Hello & World');
    expect(og.description).toBe("A 'quoted' desc");
    expect(og.image).toBe('https://cdn.example.com/x.jpg');
    expect(og.site_name).toBe('Example');
  });

  it('falls back to <title> when no og:title', () => {
    expect(parseOg('<head><title>Just a title</title></head>').title).toBe('Just a title');
  });
});

describe('parseSafeUrl', () => {
  it('rejects non-http(s) schemes', () => {
    expect(() => parseSafeUrl('ftp://x')).toThrow();
    expect(() => parseSafeUrl('javascript:alert(1)')).toThrow();
    expect(() => parseSafeUrl('not a url')).toThrow();
  });
  it('accepts https', () => {
    expect(parseSafeUrl('https://example.com/a').hostname).toBe('example.com');
  });
});

describe('safeFetch SSRF guard', () => {
  it('blocks a host that resolves to a private IP', async () => {
    lookup.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }]);
    await expect(safeFetch('https://evil.internal-thing.com', { maxBytes: 1000 })).rejects.toThrow(/private address/);
  });

  it('blocks the cloud metadata IP', async () => {
    lookup.mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    await expect(safeFetch('http://metadata.example', { maxBytes: 1000 })).rejects.toThrow(/private address/);
  });

  it('blocks localhost by name', async () => {
    await expect(safeFetch('http://localhost/x', { maxBytes: 1000 })).rejects.toThrow(/not allowed/);
  });

  it('reads a public body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ body: 'hello' })));
    const res = await safeFetch('https://example.com', { maxBytes: 1000 });
    expect(new TextDecoder().decode(res.bytes)).toBe('hello');
    vi.unstubAllGlobals();
  });
});

describe('extractUrls', () => {
  it('pulls unique urls, trims trailing punctuation, caps the count', () => {
    const urls = extractUrls('see https://a.com/x. and https://a.com/x again, plus https://b.com!', 4);
    expect(urls).toEqual(['https://a.com/x', 'https://b.com']);
  });
  it('returns empty for url-free text', () => {
    expect(extractUrls('no links here')).toEqual([]);
  });
});

describe('resolveUrl', () => {
  it('returns a degraded card for X (blocks unauthenticated reads)', async () => {
    const p = await resolveUrl('https://x.com/jack/status/123');
    expect(p.provider).toBe('X');
    expect(p.image).toBeUndefined();
    expect(p.title).toMatch(/View on X/);
  });

  it('resolves YouTube via oEmbed and caches the thumbnail', async () => {
    const fetchMock = vi
      .fn()
      // 1) oEmbed JSON
      .mockResolvedValueOnce(mockResponse({ contentType: 'application/json', body: JSON.stringify({ title: 'Vid', author_name: 'Chan', thumbnail_url: 'https://i.ytimg.com/vi/abc/hqdefault.jpg', provider_name: 'YouTube' }) }))
      // 2) thumbnail bytes
      .mockResolvedValueOnce(mockResponse({ contentType: 'image/jpeg', body: 'JPEGBYTES' }));
    vi.stubGlobal('fetch', fetchMock);
    const p = await resolveUrl('https://www.youtube.com/watch?v=abc');
    expect(p.provider).toBe('YouTube');
    expect(p.title).toBe('Vid');
    expect(p.image).toMatch(/\/og\/unfurl\/[0-9a-f]{40}\.jpg$/);
    expect(putImage).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('resolves a generic site via Open Graph', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ contentType: 'text/html', body: '<meta property="og:title" content="Blog Post"><meta property="og:image" content="https://blog.example.com/cover.png">' }))
      .mockResolvedValueOnce(mockResponse({ contentType: 'image/png', body: 'PNGBYTES' }));
    vi.stubGlobal('fetch', fetchMock);
    const p = await resolveUrl('https://blog.example.com/post');
    expect(p.provider).toBe('web');
    expect(p.title).toBe('Blog Post');
    expect(p.image).toMatch(/\/og\/unfurl\/[0-9a-f]{40}\.png$/);
    vi.unstubAllGlobals();
  });
});
