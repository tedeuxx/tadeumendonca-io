// Unfurl resolver (/backend/unfurl). Turns an external URL into a LinkPreview:
//   - YouTube / Spotify → their official oEmbed endpoint (no API key),
//   - X (twitter) / Instagram → a degraded card (they block unauthenticated reads; v1 ships a clean
//     fallback with the provider + URL, and leaves a seam for the paid official APIs later),
//   - everything else → Open Graph / Twitter Card meta scraped from the page <head>.
// Any thumbnail found is downloaded and cached to S3 (og/unfurl/<hash>) so the card serves from our CDN
// and never hotlinks or breaks. All network egress goes through the SSRF-guarded safeFetch.
import { createHash } from 'node:crypto';
import type { LinkPreview } from '../../shared/types/entities';
import { config } from '../../shared/config';
import { objectExists, putImage } from '../../shared/s3/client';
import { parseSafeUrl, safeFetch } from './ssrf';
import { parseOg } from './og';

const MAX_THUMB_BYTES = 5_000_000;
const MAX_HTML_BYTES = 1_000_000;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

// Download a source thumbnail and cache it to S3; return our CDN URL. Best-effort — a failure just
// drops the image (the card still renders with title/description). Content-addressed by source URL.
async function cacheThumbnail(imageUrl: string): Promise<string | undefined> {
  try {
    const res = await safeFetch(imageUrl, { maxBytes: MAX_THUMB_BYTES });
    const type = res.contentType.split(';')[0].trim().toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext || res.bytes.length === 0) return undefined;
    const key = `og/unfurl/${createHash('sha256').update(imageUrl).digest('hex')}.${ext}`;
    if (!(await objectExists(key))) await putImage(key, res.bytes, type);
    return `${config.spaOrigin}/${key}`;
  } catch {
    return undefined;
  }
}

// Try a provider's oEmbed endpoint. Returns null (rather than throwing) on a non-2xx response or
// unparseable body — oEmbed APIs commonly rate-limit/403 datacenter (Lambda) egress IPs, and the
// caller falls back to a still-useful card instead of dropping the preview entirely.
async function oembed(endpoint: string, target: string, provider: string): Promise<LinkPreview | null> {
  try {
    const res = await safeFetch(`${endpoint}?format=json&url=${encodeURIComponent(target)}`, { maxBytes: 200_000 });
    if (res.status < 200 || res.status >= 300) return null;
    const data = JSON.parse(new TextDecoder().decode(res.bytes)) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      provider_name?: string;
    };
    if (!data.title && !data.thumbnail_url) return null;
    return {
      url: target,
      provider,
      title: data.title,
      author: data.author_name,
      site_name: data.provider_name ?? provider,
      image: data.thumbnail_url ? await cacheThumbnail(data.thumbnail_url) : undefined,
    };
  } catch {
    return null;
  }
}

// Pull the video id from any YouTube URL shape (youtu.be/ID, watch?v=ID, shorts/embed/live/ID).
function youtubeId(u: URL): string | undefined {
  if (u.hostname.replace(/^www\./, '').toLowerCase() === 'youtu.be') return u.pathname.slice(1).split('/')[0] || undefined;
  const v = u.searchParams.get('v');
  if (v) return v;
  return /^\/(?:shorts|embed|live)\/([^/?]+)/.exec(u.pathname)?.[1];
}

// Guaranteed-non-empty thumbnail for a YouTube id, served from the public i.ytimg.com CDN (not the
// rate-limited oEmbed API), cached to our own CDN like every other thumbnail.
async function youtubeThumb(u: URL): Promise<string | undefined> {
  const id = youtubeId(u);
  return id ? cacheThumbnail(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`) : undefined;
}

// Resolve a YouTube URL to the richest card we can, never empty:
//   1) scrape the watch page's Open Graph — title + description + image in one fetch (WhatsApp-style);
//   2) if the page serves a consent interstitial (no og:title), fall back to the oEmbed API (title +
//      thumbnail) — note oEmbed often 403s the Lambda egress IP, which is exactly why scraping is first;
//   3) last resort: a thumbnail-only card from i.ytimg so there's still an image.
async function youtubeCard(u: URL, target: string, host: string): Promise<LinkPreview> {
  const og = await generic(target, host, 'YouTube');
  if (og.title) return og.image ? og : { ...og, image: await youtubeThumb(u) };
  const oe = await oembed('https://www.youtube.com/oembed', target, 'YouTube');
  if (oe) return oe;
  return { url: target, provider: 'YouTube', site_name: 'YouTube', image: await youtubeThumb(u) };
}

async function generic(target: string, host: string, provider = 'web'): Promise<LinkPreview> {
  const res = await safeFetch(target, { maxBytes: MAX_HTML_BYTES });
  if (!res.contentType.includes('html')) {
    return { url: target, provider, site_name: host };
  }
  const og = parseOg(new TextDecoder().decode(res.bytes));
  return {
    url: target,
    provider,
    title: og.title,
    description: og.description,
    site_name: og.site_name ?? host,
    author: og.author,
    image: og.image ? await cacheThumbnail(new URL(og.image, target).toString()) : undefined,
  };
}

// Providers that block unauthenticated reads — degraded card until/unless the paid official API is wired.
function degraded(target: string, provider: string): LinkPreview {
  return { url: target, provider, site_name: provider, title: `View on ${provider}` };
}

export async function resolveUrl(raw: string): Promise<LinkPreview> {
  const u = parseSafeUrl(raw);
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  const target = u.toString();

  if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) {
    return youtubeCard(u, target, host);
  }
  if (host === 'spotify.com' || host === 'open.spotify.com' || host.endsWith('.spotify.com')) {
    return (await oembed('https://open.spotify.com/oembed', target, 'Spotify')) ?? generic(target, host, 'Spotify');
  }
  if (host === 'twitter.com' || host === 'x.com') return degraded(target, 'X');
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return degraded(target, 'Instagram');

  return generic(target, host);
}

// Extract up to `max` unique http(s) URLs from a markdown body, in order of appearance.
export function extractUrls(body: string, max = 4): string[] {
  const seen = new Set<string>();
  const TRAILING_PUNCT = '.,;:!?';
  for (const m of body.matchAll(/https?:\/\/[^\s<>()\]]+/gi)) {
    let end = m[0].length; // trim trailing punctuation (linear scan, no regex backtracking)
    while (end > 0 && TRAILING_PUNCT.includes(m[0][end - 1])) end--;
    const url = m[0].slice(0, end);
    if (!seen.has(url)) seen.add(url);
    if (seen.size >= max) break;
  }
  return [...seen];
}

// Resolve every URL in a post body to a LinkPreview (best-effort, in parallel). Used on post save so
// the stored previews are server-authoritative (the client live-preview is cosmetic).
export async function resolveBodyPreviews(body: string): Promise<LinkPreview[]> {
  const urls = extractUrls(body);
  if (urls.length === 0) return [];
  const settled = await Promise.allSettled(urls.map((u) => resolveUrl(u)));
  return settled.filter((s): s is PromiseFulfilledResult<LinkPreview> => s.status === 'fulfilled').map((s) => s.value);
}
