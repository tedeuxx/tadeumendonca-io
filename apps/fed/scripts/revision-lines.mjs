// The pending revisions on disk, reduced to what an end-to-end assertion can witness (#741).
//
// `e2e/revision-preview.spec.ts` is parameterised over `src/content/revisions/`. It needs, per article
// key and locale: the published slug, and one line of READABLE text that appears in the revision and not
// in the published body (and the reverse, when one exists). Those are DERIVED here, never typed into the
// spec, so the spec follows whatever correction is pending.
//
// Plain JS in `scripts/` rather than inside the spec for two reasons: the app's typecheck carries no Node
// types (see `tsconfig.json` — adding `@types/node` to type one helper is the trade it already rejected),
// and here the derivation is unit-tested (`revision-lines.test.mjs`) like every other decision module.
// `revision-lines.d.mts` gives the spec its types.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const LOCALES = ['en', 'pt'];

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** `{ fm, body }` of a markdown file: the raw frontmatter block and the trimmed body. */
export function split(raw) {
  const m = FRONTMATTER.exec(raw);
  return { fm: m ? m[1] : '', body: (m ? m[2] : raw).trim() };
}

/**
 * The `slug:` frontmatter value, or the key — the same fallback `content.ts` applies. One quote may wrap
 * the value; a quote INSIDE it is not a slug and falls back to the key. Read line by line rather than with
 * one anchored pattern, whose lazy group between two optional quotes backtracks super-linearly.
 */
export function slugOf(fm, key) {
  const line = fm.split('\n').find((l) => l.startsWith('slug:'));
  if (line === undefined) return key;
  let value = line.slice('slug:'.length).trim();
  if (value.startsWith('"') || value.startsWith("'")) value = value.slice(1);
  if (value.endsWith('"') || value.endsWith("'")) value = value.slice(0, -1);
  return value === '' || value.includes('"') || value.includes("'") ? key : value;
}

/**
 * `[text](target)` and `![text](target)` replaced by `text` — scanned with `indexOf` rather than one
 * global pattern, whose two negated runs backtrack super-linearly on a line of unclosed brackets.
 */
export function unlink(line) {
  let out = '';
  let from = 0;
  let open = line.indexOf('[', from);
  while (open !== -1) {
    const close = line.indexOf(']', open + 1);
    if (close === -1) break;
    const end = line[close + 1] === '(' ? line.indexOf(')', close + 2) : -1;
    if (end === -1) {
      open = line.indexOf('[', open + 1);
      continue;
    }
    const start = open > from && line[open - 1] === '!' ? open - 1 : open;
    out += line.slice(from, start) + line.slice(open + 1, close);
    from = end + 1;
    open = line.indexOf('[', from);
  }
  return out + line.slice(from);
}

/**
 * The body's lines reduced to the text a reader sees: link targets, emphasis, code ticks and block
 * markers removed, whitespace collapsed. Lines a browser does not render as running text — fenced blocks
 * (a mermaid fence becomes an SVG), tables, raw HTML — yield nothing, nor does a line under 12 characters,
 * which is too short to identify anything.
 */
export function proseLines(body) {
  const out = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*[|<]/.test(line)) continue;
    const plain = unlink(line)
      .replace(/[*_`]/g, '')
      .replace(/^\s*(#+|>|[-+]|\d+\.)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (plain.length >= 12) out.push(plain);
  }
  return out;
}

/**
 * The first readable line of `a` that appears nowhere in `b`, trimmed to 60 characters so a line that
 * wraps or carries an inline element is still found as a substring of rendered text. Undefined when every
 * line of `a` is also in `b` — an addition-only revision has no published-only line, for example.
 */
export function onlyIn(a, b) {
  const other = proseLines(b).join(' ');
  for (const line of proseLines(a)) {
    const probe = line.slice(0, 60);
    if (!other.includes(probe)) return probe;
  }
  return undefined;
}

/** The app's content root — `blog/` and `revisions/` are its children. */
export const CONTENT_DIR = resolve(import.meta.dirname, '..', 'src', 'content');

/** Every pending revision under `contentDir/revisions/`, keyed and derived. `[]` when there are none. */
export function readRevisions(contentDir = CONTENT_DIR) {
  const dir = join(contentDir, 'revisions');
  if (!existsSync(dir)) return [];
  const keys = [
    ...new Set(readdirSync(dir).flatMap((f) => /^(.+)\.(?:en|pt)\.md$/.exec(f)?.[1] ?? [])),
  ].sort((a, b) => a.localeCompare(b));
  return keys.map((key) => {
    const slug = {};
    const revisionOnly = {};
    const publishedOnly = {};
    for (const locale of LOCALES) {
      const published = split(readFileSync(join(contentDir, 'blog', `${key}.${locale}.md`), 'utf8'));
      const revised = split(readFileSync(join(dir, `${key}.${locale}.md`), 'utf8'));
      slug[locale] = slugOf(published.fm, key);
      revisionOnly[locale] = onlyIn(revised.body, published.body);
      publishedOnly[locale] = onlyIn(published.body, revised.body);
    }
    return { key, slug, revisionOnly, publishedOnly };
  });
}
