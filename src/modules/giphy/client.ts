// Giphy GIF search for the blog editor (Phase 4). The API key is SERVER-SIDE only — fetched from
// Secrets Manager at runtime (/backend/secrets-management), never shipped to the browser; the SPA calls
// this BFF proxy. GIFs are hotlinked from Giphy's CDN per their ToS (we don't rehost), and the response
// carries the required "Powered By GIPHY" attribution. All egress goes through the SSRF-guarded fetch.
import { config } from '../../shared/config';
import { getSecret } from '../../shared/secrets';
import { safeFetch } from '../unfurl/ssrf';
import { AppError } from '../../shared/errors/http-errors';

const GIPHY_SEARCH = 'https://api.giphy.com/v1/gifs/search';
const MAX_BYTES = 1_000_000;

// Trimmed shape the picker needs — NOT Giphy's full payload (which is large and noisy).
export interface Gif {
  id: string;
  title: string;
  url: string; // insertable GIF (downsized)
  width: number;
  height: number;
  preview_url: string; // small still/loop for the picker grid
}

export interface GifSearch {
  items: Gif[];
  attribution: string;
}

interface GiphyImage {
  url?: string;
  width?: string;
  height?: string;
}
interface GiphyGif {
  id?: string;
  title?: string;
  images?: Record<string, GiphyImage>;
}

const pick = (img?: GiphyImage): { url: string; width: number; height: number } | undefined =>
  img?.url ? { url: img.url, width: Number(img.width ?? 0), height: Number(img.height ?? 0) } : undefined;

// Search Giphy and map each result to the trimmed Gif shape. Drops any result missing an id or a
// usable image rather than emitting a broken card.
export async function searchGifs(query: string, limit: number, offset: number): Promise<GifSearch> {
  const { api_key } = await getSecret<{ api_key: string }>(config.giphySecretArn);
  const params = new URLSearchParams({
    api_key,
    q: query,
    limit: String(limit),
    offset: String(offset),
    rating: 'g', // family-friendly only
    bundle: 'messaging_non_clips', // licensed for sharing/embedding, drops oddball renditions
  });
  const res = await safeFetch(`${GIPHY_SEARCH}?${params.toString()}`, { maxBytes: MAX_BYTES });
  if (res.status < 200 || res.status >= 300) throw new AppError(502, 'giphy_unavailable', 'giphy search failed');
  const data = JSON.parse(new TextDecoder().decode(res.bytes)) as { data?: GiphyGif[] };
  const items: Gif[] = (data.data ?? []).flatMap((g) => {
    const full = pick(g.images?.downsized) ?? pick(g.images?.fixed_width) ?? pick(g.images?.original);
    const preview = pick(g.images?.fixed_width_small) ?? pick(g.images?.preview_gif) ?? full;
    if (!g.id || !full || !preview) return [];
    return [{ id: g.id, title: g.title ?? '', url: full.url, width: full.width, height: full.height, preview_url: preview.url }];
  });
  return { items, attribution: 'Powered By GIPHY' };
}
