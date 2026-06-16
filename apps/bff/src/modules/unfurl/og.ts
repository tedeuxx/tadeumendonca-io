// Open Graph / Twitter Card extractor (/backend/unfurl). Parses the <head> meta tags from fetched
// HTML — no DOM library (keeps the Lambda bundle small); a targeted scan over the head is enough for
// the simple, well-formed meta tags OG/Twitter cards use. Returns the fields the unfurl card needs.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#x27': "'", nbsp: ' ' };

function decode(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (ENTITIES[code]) return ENTITIES[code];
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return m;
  });
}

// Pull an attribute value from a single tag string, tolerant of quote style and attribute order.
function attr(tag: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = re.exec(tag);
  if (!m) return undefined;
  return decode(m[2] ?? m[3] ?? m[4] ?? '');
}

export interface OgFields {
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  author?: string;
}

export function parseOg(html: string): OgFields {
  const head = html.slice(0, 200_000); // cap: meta lives in <head>
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'property') ?? attr(tag, 'name'))?.toLowerCase();
    const content = attr(tag, 'content');
    if (key && content != null && meta[key] === undefined) meta[key] = content;
  }
  const docTitle = /<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1];

  const pick = (...keys: string[]) => keys.map((k) => meta[k]).find((v) => v != null && v !== '');
  return {
    title: pick('og:title', 'twitter:title') ?? (docTitle ? decode(docTitle.trim()) : undefined),
    description: pick('og:description', 'twitter:description', 'description'),
    image: pick('og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image', 'twitter:image:src'),
    site_name: pick('og:site_name', 'application-name'),
    author: pick('article:author', 'author', 'twitter:creator'),
  };
}
