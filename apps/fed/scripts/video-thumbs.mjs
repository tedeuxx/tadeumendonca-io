// The pure half of the video-facade thumbnail pipeline: which thumbnails must exist, where they live,
// and which words each carries. The rendering half (gen-video-thumbs.mjs) needs a browser.
//
// Split for the same reason og-cards.mjs is split from gen-og-articles.mjs: everything that DECIDES is
// decision logic and belongs where a test can reach it without launching Chromium.
//
// WHY THIS EXISTS AT ALL. The facade used to render `https://i.ytimg.com/vi/<id>/hqdefault.jpg` in its
// not-playing branch — a GET to a Google host on render, before any click. `loading="lazy"` defers that
// request to the viewport; it does not condition it on intent. So a page carrying a video contacted a
// third party for every reader who scrolled to it, which made four published sentences on /architecture
// false ("the only third party at runtime is analytics, and it is consent-gated") and the facade's own
// header comment false on the word `requests`. The fix is a LOCAL asset: neither runtime nor build
// touches a third-party host.
//
// WHY THE ART IS OURS AND NOT YOUTUBE'S. The obvious version of this fix downloads `hqdefault.jpg` once
// and commits it. That was the shape first chosen, and it does not survive the licensing question. The
// thumbnail is the video owner's copyrighted work; YouTube's Terms of Service permit reproducing Content
// only through the Service or with the rights holder's permission, and the API Services terms — the one
// documented path to a thumbnail — require API retrieval, forbid modification, cap how long a copy may be
// stored and require it to link to the video. Committing five third-party JPEGs into a PUBLIC repository
// whose LICENSE grants MIT, and serving them from this site's own CloudFront, is outside all of it, and
// git history makes it permanent rather than revertible. `NOTICE` already carries the precedent that
// settles it: the certification badges sit OUTSIDE the licence in both directions because they are "not
// the author's to grant or reserve" — and unlike those badges, nothing here grants a right to display.
//
// So the card is SELF-AUTHORED: this site's own art, in its own design system, captioned with facts the
// repository already states. It is not a reproduction of YouTube's thumbnail and does not claim to be.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * A markdown paragraph that is nothing but a YouTube URL — the exact condition under which
 * `Markdown.tsx` swaps in the facade. Mirrors `youtubeId()` in src/components/VideoEmbed.tsx, and
 * video-thumbs.test.mjs asserts the two still agree rather than trusting this comment.
 */
const YOUTUBE_URL = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*)?$/;

/** `[url](url)` — the second lone-link form `loneUrl()` accepts, where the label IS the href. */
const SELF_LABELLED_LINK = /^\[(\S+)\]\((\S+)\)$/;

/** The 11-char id of a line that renders as a facade, or null. Both lone-link forms, nothing inline. */
export function facadeIdOnLine(line) {
  const text = line.trim();
  const self = SELF_LABELLED_LINK.exec(text);
  const url = self && self[1] === self[2] ? self[1] : text;
  return YOUTUBE_URL.exec(url)?.[1] ?? null;
}

/**
 * The public path of a video's thumbnail.
 *
 * Keyed by the YOUTUBE ID and nothing else — deliberately NOT by locale, unlike the OG cards. A card
 * carries a per-locale title because the article has two editions; a video has one identity and both
 * editions embed the same id, so a per-locale copy would be two identical files diverging by accident.
 * That is also why the caption is language-neutral (a channel name, a talk's own name) rather than
 * translated prose.
 */
export const thumbPath = (id) => `/video/${id}.png`;

/**
 * Every video id the CONTENT embeds, deduped and sorted.
 *
 * Derived from the markdown rather than from a list, for the reason og-cards.mjs gives: a list is a
 * second place to update, and the failure it produces is invisible. Here that failure is the whole
 * point of the slice — a sixth video with no committed asset would fall back to nothing, and the
 * temptation would be to restore the ytimg URL "just for that one".
 */
export function videoIdsIn(contentDir) {
  const ids = new Set();
  for (const file of markdownFilesIn(contentDir)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const id = facadeIdOnLine(line);
      if (id) ids.add(id);
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

/** Every `.md` under a directory, recursively — articles live one level down, in `blog/`. */
export function markdownFilesIn(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...markdownFilesIn(full));
    else if (extname(entry) === '.md') out.push(full);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Every thumbnail the current content requires, as `{ id, path }`. */
export function requiredThumbs(ids) {
  return ids.map((id) => ({ id, path: thumbPath(id) }));
}

/** The thumbnails actually present in `public/video/`, as public paths. */
export function generatedThumbsIn(thumbDir) {
  let files = [];
  try {
    files = readdirSync(thumbDir);
  } catch {
    return []; // the directory not existing is the same finding as it being empty
  }
  return files
    .filter((f) => f.endsWith('.png'))
    .map((f) => `/video/${f}`)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Compare required against generated, BOTH ways.
 *
 * `missing` is the case that ships the defect back: a facade pointing at a 404, and a maintainer one
 * keystroke from "re-adding" the ytimg URL to make the picture come back. `orphaned` breaks no page,
 * which is exactly why `public/video/` would quietly accumulate art for videos no longer embedded.
 */
export function diffThumbs(required, generated) {
  const have = new Set(generated);
  const want = new Set(required.map((t) => t.path));
  return {
    missing: required.filter((t) => !have.has(t.path)),
    orphaned: generated.filter((p) => !want.has(p)),
  };
}

/** Read the hand-authored caption manifest. */
export function readManifest(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Manifest vs content, both ways.
 *
 * `unlabelled` is the one that blocks: the card is generated FROM the manifest, so an id with no entry
 * has no art to generate and the generator would either crash late or, worse, write a blank rectangle.
 * `unused` is an entry for a video the content no longer embeds — harmless to a reader, invisible
 * forever, and the reason it is checked here.
 */
export function diffManifest(ids, manifest) {
  return {
    unlabelled: ids.filter((id) => !manifest[id]),
    unused: Object.keys(manifest)
      .filter((id) => !ids.includes(id))
      .sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Every id whose `embeddable` value is outside the one-value vocabulary.
 *
 * THE VOCABULARY IS: the key is absent, or it is exactly `false`. There is deliberately no `true`, and
 * `src/components/VideoEmbed.tsx`'s `embeddingDisabled()` carries the full argument — the short version
 * is that a wrong `false` is a visible downgrade and a wrong `true` is a player that dies after a click,
 * so the direction nobody can see is removed from the schema rather than trusted to a reviewer.
 *
 * This is a SCHEMA check and it is the only thing here that runs in a gate. It cannot tell whether a
 * declared `false` is TRUE — that needs YouTube, and `check-video-embeddable.mjs` is the separate,
 * deliberately ungated script that asks. Read a green here as "nobody typed a value the renderer would
 * misread", never as "the flags are right".
 */
export function invalidEmbeddable(manifest) {
  return Object.entries(manifest)
    .filter(([, entry]) => 'embeddable' in entry && entry.embeddable !== false)
    .map(([id, entry]) => ({ id, value: entry.embeddable }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Every id the manifest declares non-embeddable, sorted. */
export function nonEmbeddableIds(manifest) {
  return Object.keys(manifest)
    .filter((id) => manifest[id]?.embeddable === false)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The two lines a card renders: a channel (always) and a caption (only where the repository already
 * states the video's own name — see the header on why nothing here is invented or fetched).
 */
export function cardLines(id, manifest) {
  const entry = manifest[id];
  if (!entry?.channel) throw new Error(`videos.json has no \`channel\` for ${id} — cannot build a card`);
  return { channel: entry.channel, caption: entry.caption ?? '' };
}
