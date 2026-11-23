// The per-post record of the funnel review, and the two things the rite does with it (#819).
//
// `docs/funnel-review/posts.md` records every post the owner publishes under the channel strategy
// (the communication and channel strategy requirements document, section 8): which piece, which
// platform, which language the post is in, the day it went out, the address it carried VERBATIM with
// its campaign tags, and the post's own URL. Each post also carries its native reach as the owner read
// it, with a status, because native reach exists only inside each platform.
//
// Each post also carries its social-post format code (#831), from the catalog that tedeuxx/mhw#573 adds to
// the method's `published-voice` skill (not merged yet):
// `F1` is the article digest, which carries a piece and a link; `F2`, `F3a`, `F3b` and `F3c` are rotation
// posts, which carry neither, so their piece and address fields are `-`. A post published with no code is
// `unlabelled`, never a guessed code. Once that change merges, the funnel review is to write the code as
// the `<format>` segment of its post spelling `<metric>.<format>.<post>`, and compare posts by it.
//
// What this module does with that record:
//   1. validates it against the site (the piece exists, the address is the route the strategy says that
//      platform carries, the address is tagged);
//   2. matches each post to the sessions that carry its tags, from `session-row:` lines the rite writes
//      into a period's collection file, and prints the `figure:` lines for them;
//   3. counts the pieces whose posts are all recorded, against the baseline declared in
//      `docs/funnel-review/declarations.md`: no numeric target until that many pieces have shipped.
//
// It reads no network and decides no target. The record is an assertion by whoever wrote it, exactly as
// a collection file is; nothing here can tell a true post URL from a plausible one.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { URL, pathToFileURL } from 'node:url';

export const PLATFORMS = ['linkedin', 'x', 'youtube'];
/** A text post is one bilingual post, its opening language first; a video post is one language. */
export const TEXT_LANGUAGES = ['pt-en', 'en-pt'];
export const VIDEO_LANGUAGES = ['pt', 'en'];
const TEXT_PLATFORMS = new Set(['linkedin', 'x']);
const POST_HOSTS = {
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  x: ['x.com', 'twitter.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
};
/** The closed catalog tedeuxx/mhw#573 adds to `published-voice` (not merged yet), plus `unlabelled` for a post recorded with no code. */
export const LINKED_FORMATS = ['F1'];
export const ROTATION_FORMATS = ['F2', 'F3a', 'F3b', 'F3c'];
export const FORMATS = [...LINKED_FORMATS, ...ROTATION_FORMATS, 'unlabelled'];
/** The field value a post with no piece and no link carries in place of each. */
export const ABSENT = '-';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN = /^[^\s:]+$/;

/** Column-0 lines of the record. Anything else is prose and records nothing. */
export function parsePostRecord(text) {
  const posts = [];
  const reach = [];
  const malformed = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^(post|reach): (.+)$/.exec(line);
    if (!m) continue;
    const fields = m[2].trim().split(/\s+/);
    if (m[1] === 'post') {
      if (fields.length !== 7) {
        malformed.push(line);
        continue;
      }
      const [piece, platform, language, posted, address, url, format] = fields;
      posts.push({
        piece: piece === ABSENT ? null : piece,
        platform,
        language,
        posted,
        address: address === ABSENT ? null : address,
        url,
        format,
      });
    } else {
      const [url, ...status] = fields;
      reach.push({ url, status });
    }
  }
  return { posts, reach, malformed };
}

/** The slot a post fills in a piece's post set: the platform for a text post, platform:language for video. */
export const slotOf = (post) => (TEXT_PLATFORMS.has(post.platform) ? post.platform : `${post.platform}:${post.language}`);

/** Every path a piece is reachable at: the neutral address and one edition per language. */
export function piecePaths(pair) {
  return new Set([`/blog/${pair.en}`, ...VIDEO_LANGUAGES.map((l) => `/${l}/blog/${pair[l]}`)]);
}

/** The route the strategy says a post on this platform carries (ADR-0052 neutral for text, per language for video). */
function expectedPath(post, pair) {
  return TEXT_PLATFORMS.has(post.platform) ? `/blog/${pair.en}` : `/${post.language}/blog/${pair[post.language]}`;
}

function checkLanguage(post) {
  const allowed = TEXT_PLATFORMS.has(post.platform) ? TEXT_LANGUAGES : VIDEO_LANGUAGES;
  return allowed.includes(post.language) ? [] : [`language ${post.language} is not one of ${allowed.join(' ')}`];
}

function checkPostUrl(post) {
  let u;
  try {
    u = new URL(post.url);
  } catch {
    return [`post URL ${post.url} is not a URL`];
  }
  return u.protocol === 'https:' && POST_HOSTS[post.platform].includes(u.hostname)
    ? []
    : [`post URL ${post.url} is not an https ${post.platform} address`];
}

function checkAddress(post, pair, { siteUrl, authorCampaign, shareMedium }) {
  let u;
  try {
    u = new URL(post.address);
  } catch {
    return [`address ${post.address} is not a URL`];
  }
  const problems = [];
  if (u.origin !== siteUrl) problems.push(`address ${post.address} is not on ${siteUrl}`);
  const want = expectedPath(post, pair);
  if (u.pathname !== want) problems.push(`address path ${u.pathname} is not ${want}`);
  const tag = (k) => u.searchParams.get(k);
  if (tag('utm_campaign') !== authorCampaign) problems.push(`utm_campaign is not ${authorCampaign}`);
  if (!tag('utm_source')) problems.push('utm_source is missing');
  if (!tag('utm_medium')) problems.push('utm_medium is missing');
  // The owner's ruling on #819 fixes LinkedIn's and X's values. YouTube's come from #817, so only their
  // presence is checked here.
  if (TEXT_PLATFORMS.has(post.platform)) {
    if (tag('utm_source') !== post.platform) problems.push(`utm_source is not ${post.platform}`);
    if (tag('utm_medium') !== shareMedium) problems.push(`utm_medium is not ${shareMedium}`);
  }
  return problems;
}

function checkReachStatus(status) {
  if (status.length === 1 && status[0] === 'unread') return true;
  return (
    status.length === 5 &&
    status[0] === 'read' &&
    DATE.test(status[1]) &&
    status[2] === 'owner-native-ui' &&
    TOKEN.test(status[3]) &&
    /^\d+$/.test(status[4])
  );
}

/**
 * Every problem in the record, as `<what>: <problem>` strings. Empty means valid.
 * `editions` is buildBlogEditions' Map of piece key → { pt, en }.
 */
/** True for a post that carries a piece and a link; a rotation post does not. */
export const isLinked = (post) => post.piece !== null;

/**
 * The format code against the post's shape: `F1` carries a piece and a link, a rotation code carries
 * neither, `unlabelled` may be either. The catalog covers LinkedIn and X posts only, so a YouTube post
 * is `unlabelled`. Piece and address are present together or absent together.
 */
function checkFormat(post) {
  if (!FORMATS.includes(post.format)) return [`format ${post.format} is not one of ${FORMATS.join(' ')}`];
  const linked = isLinked(post);
  if (linked !== (post.address !== null)) return ['piece and address must both be present or both be -'];
  if (!TEXT_PLATFORMS.has(post.platform)) {
    if (post.format !== 'unlabelled') return [`format ${post.format} is a LinkedIn or X format; a ${post.platform} post is unlabelled`];
    if (!linked) return [`a ${post.platform} post carries its piece and address`];
    return [];
  }
  if (LINKED_FORMATS.includes(post.format) && !linked) return [`format ${post.format} carries a piece and an address`];
  if (ROTATION_FORMATS.includes(post.format) && linked) return [`format ${post.format} carries no piece and no address; write -`];
  return [];
}

/** One post's own problems: what it is, its format, and the address it carried. */
function checkPost(post, pair, options) {
  if (!PLATFORMS.includes(post.platform)) return [`platform ${post.platform} is not one of ${PLATFORMS.join(' ')}`];
  const formatProblems = checkFormat(post);
  if (formatProblems.length) return formatProblems;
  const languageProblems = checkLanguage(post);
  const common = [
    ...languageProblems,
    ...(DATE.test(post.posted) ? [] : [`posted date ${post.posted} is not YYYY-MM-DD`]),
    ...checkPostUrl(post),
  ];
  if (!isLinked(post)) return common;
  if (!pair) return [`piece ${post.piece} is not a published piece`];
  return [
    ...common,
    // An address can only be held to its expected route once the language names one.
    ...(languageProblems.length === 0 ? checkAddress(post, pair, options) : []),
  ];
}

export function validatePostRecord(record, editions, options) {
  const problems = record.malformed.map((line) => `malformed post line: ${line}`);
  const seen = new Set();
  const slots = new Set();
  for (const post of record.posts) {
    const at = (p) => `${post.url}: ${p}`;
    problems.push(...checkPost(post, isLinked(post) ? editions.get(post.piece) : undefined, options).map(at));
    if (seen.has(post.url)) problems.push(at('recorded twice'));
    seen.add(post.url);
    // A rotation post has no piece and no sessions to match, so it fills no slot.
    if (!isLinked(post)) {
      if (!record.reach.some((r) => r.url === post.url)) problems.push(at('has no reach: line'));
      continue;
    }
    const slot = `${post.piece} ${slotOf(post)}`;
    if (slots.has(slot)) problems.push(at(`a second post for ${slot}, which the session match cannot tell apart`));
    slots.add(slot);
    if (!record.reach.some((r) => r.url === post.url)) problems.push(at('has no reach: line'));
  }
  for (const r of record.reach) {
    if (!seen.has(r.url)) problems.push(`${r.url}: reach: line names no recorded post`);
    if (!checkReachStatus(r.status)) problems.push(`${r.url}: reach status "${r.status.join(' ')}" is not a declared shape`);
  }
  return problems;
}

/**
 * The baseline count. A piece counts only when every slot of the declared post set is recorded for it,
 * so a half-distributed piece does not start the clock.
 */
export function baselineStatus(posts, postSet, threshold) {
  const byPiece = new Map();
  for (const post of posts.filter(isLinked)) {
    const slots = byPiece.get(post.piece) ?? new Set();
    slots.add(slotOf(post));
    byPiece.set(post.piece, slots);
  }
  const complete = [];
  const incomplete = [];
  for (const [piece, slots] of byPiece) {
    const missing = postSet.filter((s) => !slots.has(s));
    if (missing.length === 0) complete.push(piece);
    else incomplete.push({ piece, missing });
  }
  return {
    complete,
    incomplete,
    threshold,
    targetsAllowed: complete.length >= threshold,
  };
}

/** `session-row: <source> <medium> <campaign> <landing-page> <locale> <sessions>` lines of a collection file. */
export function parseSessionRows(text) {
  const rows = [];
  const malformed = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^session-row: (.+)$/.exec(line);
    if (!m) continue;
    const f = m[1].trim().split(/\s+/);
    if (f.length !== 6 || !/^\d+$/.test(f[5])) {
      malformed.push(line);
      continue;
    }
    const [source, medium, campaign, landing, locale, sessions] = f;
    rows.push({
      source,
      medium,
      campaign,
      landing,
      locale,
      sessions: Number(sessions),
    });
  }
  return { rows, malformed };
}

/**
 * The session rows a post produced: the rows carrying the three tags of the address the post carried,
 * whose landing page is one of that post's piece's paths. The piece is what separates two posts on one
 * platform for different pieces; the source is what separates LinkedIn from X for one piece.
 */
export function matchSessions(post, rows, pair) {
  const tags = new URL(post.address).searchParams;
  const paths = piecePaths(pair);
  return rows.filter(
    (r) =>
      r.source === tags.get('utm_source') &&
      r.medium === tags.get('utm_medium') &&
      r.campaign === tags.get('utm_campaign') &&
      paths.has(r.landing.split('?')[0]),
  );
}

/**
 * The `figure:` lines for every recorded post, split by the SESSION's language: the metric names the
 * post (its slot), the qualifier names the piece and the language the reader landed in, which is a
 * different field from the post's own language. The sample size is every session row in the collection.
 */
export function postFigures(posts, rows, editions) {
  const total = rows.reduce((n, r) => n + r.sessions, 0);
  const lines = [];
  for (const post of posts.filter(isLinked)) {
    const pair = editions.get(post.piece);
    if (!pair) continue;
    const byLocale = new Map();
    for (const r of matchSessions(post, rows, pair)) byLocale.set(r.locale, (byLocale.get(r.locale) ?? 0) + r.sessions);
    const metric = `sessions_post_${slotOf(post).replace(':', '-')}`;
    for (const locale of VIDEO_LANGUAGES) {
      lines.push(`figure: ga4 ${metric}:${post.piece}:${locale} ${byLocale.get(locale) ?? 0} ${total}`);
    }
  }
  return lines;
}

/** `post-set:` and `baseline-pieces:` from the declarations file. */
export function readBaselineDeclarations(text) {
  const line = (key) => new RegExp(`^${key}: (.+)$`, 'm').exec(text)?.[1].trim().split(/\s+/);
  const postSet = line('post-set');
  const pieces = line('baseline-pieces');
  if (!postSet || !pieces || !/^\d+$/.test(pieces[0]))
    throw new Error('declarations carry no post-set: or baseline-pieces: line');
  return { postSet, threshold: Number(pieces[0]) };
}

/**
 * The campaign vocabulary, read out of `apps/fed/src/lib/utm.ts` rather than retyped: that module is the
 * single place the strings exist (ADR-0005, *Campaign tagging of shared links*), and this script runs in plain Node, which cannot import it.
 */
export function readUtmVocabulary(source) {
  const value = (name) => new RegExp(`export const ${name} = '([^']+)'`).exec(source)?.[1];
  const vocabulary = {
    authorCampaign: value('AUTHOR_CAMPAIGN'),
    shareMedium: value('SHARE_MEDIUM'),
  };
  if (!vocabulary.authorCampaign || !vocabulary.shareMedium)
    throw new Error('utm.ts declares no AUTHOR_CAMPAIGN or SHARE_MEDIUM');
  return vocabulary;
}

const readText = (path) => readFileSync(path, 'utf8');

/** A period name: what `funnel-review.sh` takes, and nothing that can leave the directory. */
const PERIOD = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * The collection file of a period, `<store>/collected/<period>.tsv`. The CLI takes a period name, never a
 * path, so its one command-line argument cannot point the script at a file outside the store.
 */
export function collectionPath(store, period) {
  const dir = resolve(store, 'collected');
  if (!PERIOD.test(period) || period.includes('..')) throw new Error(`not a period name: ${period}`);
  const path = resolve(dir, `${period}.tsv`);
  if (!path.startsWith(dir + sep)) throw new Error(`not a period name: ${period}`);
  return path;
}

/**
 * The CLI: validate the record, print the baseline, and with a period name print that period's post figures.
 * `read` maps a path to its text; the suite passes one that answers some paths from memory.
 */
export async function main(argv, { repo, read = readText, out = console.log, err = console.error }) {
  const store = join(repo, 'docs', 'funnel-review');
  const routes = await import(join(repo, 'apps', 'fed', 'scripts', 'routes.mjs'));
  const utm = readUtmVocabulary(read(join(repo, 'apps', 'fed', 'src', 'lib', 'utm.ts')));
  const blog = join(repo, 'apps', 'fed', 'src', 'content', 'blog');
  const editions = routes.buildBlogEditions(readdirSync(blog), (f) => readText(join(blog, f)));
  const record = parsePostRecord(read(join(store, 'posts.md')));
  const problems = validatePostRecord(record, editions, {
    siteUrl: routes.SITE_URL,
    ...utm,
  });
  for (const p of problems) err(`posts.md: ${p}`);

  const baseline = readBaselineDeclarations(read(join(store, 'declarations.md')));
  const status = baselineStatus(record.posts, baseline.postSet, baseline.threshold);
  out(
    `baseline: ${status.complete.length} of ${status.threshold} pieces fully posted; ` +
      (status.targetsAllowed ? 'a numeric target may now be set' : 'no numeric target yet'),
  );
  for (const { piece, missing } of status.incomplete) out(`baseline: ${piece} does not count yet, missing ${missing.join(' ')}`);

  if (argv.period) {
    const { rows, malformed } = parseSessionRows(read(collectionPath(store, argv.period)));
    for (const line of malformed) err(`malformed session-row line: ${line}`);
    for (const line of postFigures(record.posts, rows, editions)) out(line);
    if (malformed.length) return 1;
  }
  return problems.length ? 1 : 0;
}

/* c8 ignore start -- the entry guard; main() is what the suite exercises */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repo = resolve(import.meta.dirname, '..', '..', '..');
  process.exitCode = await main({ period: process.argv[2] }, { repo });
}
/* c8 ignore stop */
