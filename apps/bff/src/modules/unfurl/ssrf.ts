// SSRF guard + bounded fetch for the unfurl module (/backend/unfurl, /backend/security). Even though
// only the admin submits URLs, server-side fetching of arbitrary URLs is a classic SSRF vector, so we:
//   - allow only http/https,
//   - resolve DNS and reject any private/loopback/link-local/reserved IP (incl. the cloud metadata IP),
//   - follow redirects MANUALLY, re-validating each hop's host (a public host can 30x to an internal one),
//   - cap the time budget and the bytes read.
import { lookup } from 'node:dns/promises';
import { BadRequestError } from '../../shared/errors/http-errors';

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 4000;

// IPv4 ranges that must never be fetched (private, loopback, link-local, CGNAT, broadcast, "this host").
function isBlockedV4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // malformed → block
  const [a, b] = p;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 (metadata)
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved + 255.255.255.255
  return false;
}

function isBlockedV6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === '::1' || v === '::') return true; // loopback / unspecified
  if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true; // link-local + ULA
  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4.
  const mapped = /::ffff:(\d+\.\d+\.\d+\.\d+)/.exec(v);
  if (mapped) return isBlockedV4(mapped[1]);
  return false;
}

async function assertHostAllowed(hostname: string): Promise<void> {
  // Block literal hostnames that never resolve to a safe public host.
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) {
    throw new BadRequestError('url host is not allowed');
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    throw new BadRequestError('url host does not resolve');
  }
  if (addrs.length === 0) throw new BadRequestError('url host does not resolve');
  for (const { address, family } of addrs) {
    const blocked = family === 6 ? isBlockedV6(address) : isBlockedV4(address);
    if (blocked) throw new BadRequestError('url resolves to a private address');
  }
}

export function parseSafeUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new BadRequestError('invalid url');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new BadRequestError('only http(s) urls are supported');
  return u;
}

export interface FetchResult {
  status: number;
  contentType: string;
  bytes: Uint8Array;
}

// Fetch a URL with the full SSRF guard, manual redirect re-validation, a timeout, and a byte cap.
export async function safeFetch(raw: string, opts: { maxBytes: number; timeoutMs?: number } = { maxBytes: 2_000_000 }): Promise<FetchResult> {
  let current = parseSafeUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertHostAllowed(current.hostname);
      const res = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        // Identify as a link-preview crawler. Sites (YouTube, news, social) serve their Open Graph
        // page to the recognised `facebookexternalhit` token — even from datacenter IPs that otherwise
        // get a consent/bot interstitial — which is exactly how WhatsApp/LinkedIn build rich cards. We
        // keep our own +URL appended so the request is still honestly attributable to us.
        headers: {
          'user-agent': 'facebookexternalhit/1.1 (+https://tadeumendonca.io/unfurl) tadeumendonca-unfurl/1.0',
          accept: 'text/html,application/xhtml+xml,*/*',
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = parseSafeUrl(new URL(res.headers.get('location')!, current).toString());
        continue; // re-validate the new host on the next loop iteration
      }
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.length;
          if (total > opts.maxBytes) {
            await reader.cancel();
            break; // truncate at the cap — enough for <head> meta or a thumbnail
          }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(total > opts.maxBytes ? opts.maxBytes : total);
      let off = 0;
      for (const ch of chunks) {
        if (off + ch.length > bytes.length) {
          bytes.set(ch.subarray(0, bytes.length - off), off);
          break;
        }
        bytes.set(ch, off);
        off += ch.length;
      }
      return { status: res.status, contentType: res.headers.get('content-type') ?? '', bytes };
    }
    throw new BadRequestError('too many redirects');
  } finally {
    clearTimeout(timer);
  }
}
