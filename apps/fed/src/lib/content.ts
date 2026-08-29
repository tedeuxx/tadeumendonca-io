// Blog content — sourced from markdown-in-repo (build-time). Vite bundles every .md under
// content/blog as a raw string; we parse the YAML frontmatter (js-yaml) + the markdown body here, so
// the SPA renders the blog with NO backend call. This module is the single source of truth for the
// articles section and /blog/:slug (the prerender / OG-image pipeline reads the same slugs).
//
// Every article is authored in BOTH locales — one markdown file per language, `<KEY>.pt.md` /
// `<KEY>.en.md` (the reference implementation is `src/content/rampup.{pt,en}.md`). The filename base is
// the article's stable KEY — the grouping key that pairs the two editions; it is NEVER a URL (by
// convention it is the canonical English slug). The contract is UNPUBLISHABLE-if-incomplete: a KEY that
// lacks either locale throws at module load, which fails the build, the prerender and the test suite. The
// loader makes the single-language case impossible, not merely discouraged.
//
// Identity is the filename KEY, not the slug. Per-locale slugs (ADR-0037) mean the two editions carry
// DIFFERENT slugs — EN `/en/blog/my-commitment`, PT `/pt/blog/meu-compromisso` — so `slug` is authored
// once PER LOCALE (frontmatter) and left OUT of the shared-fact set. This mirrors the CV: prose
// (title/excerpt/takeaway/body) and now the slug are per-locale, while the remaining FACTS (date, tag,
// track, links, media) are authored once and MUST agree across the two editions — a disagreement is a
// mistake, so it throws.
import yaml from 'js-yaml';
import { LOCALES, type Locale } from '../i18n/config';

/** Audience track. `pessoal` = everyday-life automation (no code); `engenharia` = AI in production. */
export type Track = 'pessoal' | 'engenharia';
// A Set, not an array: its only use is a membership test, and `Set` says that at the declaration rather
// than at the call site. Two elements, so this is about intent, not lookup cost.
const TRACKS: ReadonlySet<Track> = new Set(['pessoal', 'engenharia']);

export interface BlogPost {
  slug: string;
  /**
   * Slugs this edition used to be published under, and the reason this field exists at all:
   * a published URL is a permanent contract (ADR-0010), and ADR-0037 makes a slug per-locale and therefore
   * CORRECTABLE. Correcting one without recording what it replaced silently 404s every link already in the
   * world — the one failure this repo cannot fix after the fact, because a scraper pins what it first read.
   *
   * Authored next to the slug it retires, in the same frontmatter, so the pair cannot drift; per-locale for
   * the same reason `slug` is (it IS a slug), hence deliberately outside FACT_KEYS. `App.tsx` turns each
   * entry into a client-side redirect to the current slug — the same `<Navigate … replace>` mechanism every
   * other back-compat path on this site uses. Never prerendered and never in the sitemap: a redirect is not
   * a route (ADR-0010's 2026-07-24 amendment states the rule; `routes.mjs` reads `slug` only, so it is the
   * shape of that module rather than a filter that keeps these out).
   */
  previousSlugs: string[];
  title: string;
  /** ISO 8601 — keep it quoted in frontmatter so YAML doesn't coerce it to a Date. */
  date: string;
  tag: string;
  /** Which audience the piece is written for. Unknown or missing → `engenharia`. */
  track: Track;
  excerpt?: string;
  /** Reader-first promise, rendered as "Você sai sabendo …" on the article row. */
  takeaway?: string;
  /** Deep-link to the LinkedIn edition of the same piece (the site hosts the canonical). */
  linkedinUrl?: string;
  /** Marks a post whose body embeds a video, so the row can advertise it. */
  hasVideo?: boolean;
  /**
   * HELD: built and reachable at its final URL, but out of every public enumeration (#510).
   *
   * A held article leaves the index, the feed, the navigation, the sitemap, the prerender, the OG cards
   * and the distribution drafts — and stays RESOLVABLE by `getPostBySlug`/`getEditions`, because the page
   * has to render for the owner reading it with the preview parameter. That divergence is the whole
   * mechanism; see the `byLocale` / `getPostBySlug` pair below, which is the one place the two behaviours
   * must differ.
   *
   * An explicit flag rather than a future `date`, deliberately (ADR-0049): a wall-clock comparison makes
   * the SAME COMMIT build differently tomorrow, which breaks "rebuild the tag to reproduce production".
   * Promotion is one edit — `draft: false` plus the real date — and a scheduled publication becomes a
   * scheduled COMMIT, which is strictly more auditable than a time-dependent build.
   *
   * WHAT IT DOES NOT DO, stated here because the field name invites the opposite reading: it is
   * ISOLATION, not privacy. While a held draft is deployed its full body — both locales — ships inside
   * `dist/assets/index-*.js` and is fetchable by anyone with no parameter at all. Nobody stumbles into
   * it; anyone who knows to look will find it. ADR-0049 records that consequence with the command that
   * measures it.
   *
   * A FACT (`FACT_KEYS`), so the two editions cannot disagree: a held PT edition beside a published EN
   * one would publish half an article, which is the exact failure the unpublishable contract exists for.
   */
  draft: boolean;
  /**
   * The GitHub Issue this article's review happens on — the `content`-typed Issue, where `content-writer`
   * reads and where the owner pastes his marked-up copy (#506).
   *
   * THE ISSUE, NOT THE PR, and that is the ratified proposal rather than a coin toss: a PR is transient —
   * it merges, its conversation stops being the place anyone looks, and a second round needs a second
   * thread. The Issue outlives every PR the article travels through, so one address holds the whole
   * review history.
   *
   * OPTIONAL, and the degradation is the design. Every article published before #506 has no such field,
   * and the review bar renders NO issue button for one — a button that opened the wrong Issue, or the
   * tracker's front page, is worse than no button, because it looks like it worked. A present-but-
   * unusable value is the opposite case and throws at module load (see `asIssueNumber`): an author who
   * meant to name an Issue and mistyped it must not silently get the no-button state, which is
   * indistinguishable from never having tried.
   *
   * A FACT (`FACT_KEYS`), so the two editions cannot disagree. One article is reviewed on one Issue in
   * both languages — the owner reads the pair together and comments in one place — so two editions naming
   * two Issues would split one review across two threads with nothing pointing at the other.
   */
  contentIssue?: number;
  /** Optional cover image path. */
  cover?: string;
  /** Optional OG image path (defaults handled by the prerender pipeline). */
  ogImage?: string;
  /** Markdown body (rendered by <Markdown>). */
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
// `<slug>.<locale>.md` — the locale segment is validated against LOCALES, the rest is the slug.
const FILENAME = /\/([^/]+)\.([^./]+)\.md$/;

// Facts are authored once and shared: they identify the piece, not its prose, so the two editions
// cannot disagree about them. Prose (title, excerpt, takeaway, body) is deliberately NOT here — and
// neither is `slug` — nor `previousSlugs`, which is a list OF slugs and per-locale for the same reason.
// (It would also throw on every article regardless: FACT_KEYS compares with `!==`, and two arrays are
// never `===`.) Identity is the filename KEY, not the slug (ADR-0037).
const FACT_KEYS = [
  'date',
  'tag',
  'track',
  'draft',
  'contentIssue',
  'linkedinUrl',
  'hasVideo',
  'cover',
  'ogImage',
] as const;

const asTrack = (value: unknown): Track => (TRACKS.has(value as Track) ? (value as Track) : 'engenharia');
const asString = (value: unknown): string | undefined => (value != null ? String(value) : undefined);
// A YAML list, normalised to `string[]`. A single scalar is accepted as a one-element list because that is
// the overwhelmingly common case (one correction), and an author writing `previousSlugs: old-slug` should
// get a redirect rather than a silent no-op — the failure mode of dropping it is a dead published URL.
const asStringList = (value: unknown): string[] =>
  value == null ? [] : (Array.isArray(value) ? value : [value]).map((v) => String(v));

/**
 * A GitHub Issue number from frontmatter — absent, or a positive integer, or a build failure.
 *
 * IT THROWS RATHER THAN FALLING BACK, unlike every other optional field parsed here, and the asymmetry is
 * the point. `asString` returning `undefined` for a malformed excerpt loses a sentence; this value becomes
 * a LINK TARGET, so the two failure directions are not comparable: a silent `undefined` removes the button
 * the author was trying to add (invisible — it looks exactly like an article that never had one), and a
 * coerced `NaN`/`0` would build `/issues/NaN`, a live GitHub URL that 404s the reviewer. The build is the
 * only place this can fail loudly, so it fails there.
 *
 * `Number(String(...))` rather than a `typeof value === 'number'` gate: YAML gives a number for `506` and a
 * string for `"506"`, and an author quoting it has made no mistake. `Number.isInteger` then rejects `506.5`,
 * `abc` (NaN) and the empty string (which `Number('')` coerces to 0 — the reason `> 0` is checked and not
 * merely `!== NaN`).
 */
const asIssueNumber = (fileSlug: string, value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `content: article "${fileSlug}" has an unusable contentIssue "${String(value)}" — it becomes a link ` +
        'to a GitHub Issue, so it must be a positive integer (e.g. `contentIssue: 506`). Omit the field ' +
        'entirely for an article with no review Issue; the review affordance then renders no button.',
    );
  }
  return parsed;
};

function parse(fileSlug: string, raw: string): BlogPost {
  const m = FRONTMATTER.exec(raw);
  const fm: Record<string, unknown> = (m ? (yaml.load(m[1]) as Record<string, unknown> | null) : null) ?? {};
  const body = (m ? m[2] : raw).trim();
  return {
    slug: String(fm.slug ?? fileSlug),
    previousSlugs: asStringList(fm.previousSlugs),
    title: String(fm.title ?? fileSlug),
    date: String(fm.date ?? ''),
    tag: String(fm.tag ?? ''),
    track: asTrack(fm.track),
    // `=== true`, not truthy: an author writing `draft: "false"` (a YAML string, which is truthy) must not
    // silently hold a finished article, and an absent flag must never read as held. The conservative
    // default for a MISSING flag is published, because the alternative — every legacy article suddenly
    // held — is a site that quietly loses its index.
    draft: fm.draft === true,
    contentIssue: asIssueNumber(fileSlug, fm.contentIssue),
    excerpt: asString(fm.excerpt),
    takeaway: asString(fm.takeaway),
    linkedinUrl: asString(fm.linkedinUrl),
    hasVideo: fm.hasVideo === true,
    cover: asString(fm.cover),
    ogImage: asString(fm.ogImage),
    body,
  };
}

/** A slug resolved to its two editions, keyed by locale. */
type Editions = Record<Locale, BlogPost>;

/**
 * The shape a slug may take (#213). A slug is not free text — it becomes a URL segment, and the edge that
 * serves that URL constrains it.
 *
 * The binding constraint is the DOT. `iac/cloudfront-functions/spa-rewrite.js` decides "file vs route" by
 * comparing the last `.` against the last `/`, so a slug containing a dot (`node.js-patterns`,
 * `v1.2-release`) is read as a FILE: the request is not rewritten to the prerendered `index.html`, it
 * 404s at the origin, and `custom_error_response` answers **200 with the home page** — carrying the home
 * page's OG card, permanently pinned by the first scraper (ADR-0005). A published article silently
 * serving the home page to every crawler and every unfurl.
 *
 * That failure is invisible in local dev — `vite preview` serves the SPA fallback for everything, so the
 * article renders fine on the author's machine and breaks only once deployed. Which is exactly why it has
 * to be a build-time error rather than something to remember.
 *
 * The rest of the shape (lowercase, no slash, no whitespace, no leading/trailing or doubled hyphen) is
 * not edge-driven — it is what keeps a URL readable and unambiguous, and it costs nothing to require at
 * authoring time. `spa-rewrite.test.mjs` pins the CloudFront behaviour this constrains against.
 */
// Exported so `scripts/routes.test.mjs` can assert its own copy is IDENTICAL to this one. That module
// re-derives slugs independently (it runs in Node and cannot import this file at build time), so the two
// patterns can drift — and a drift means the sitemap rejects a slug the app accepts, or the reverse.
export const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Each branch names WHY, not just what — the rules are not guessable from the pattern, and the
// non-ASCII one is the least obvious: "ó" IS a lowercase letter, so a pt author would otherwise
// read the generic message and conclude the validator is wrong.
function slugDefect(slug: string): string | undefined {
  if (SLUG_SHAPE.test(slug)) return undefined;
  if (slug.includes('.')) {
    return 'a dot makes CloudFront treat the URL as a FILE, so it serves the home page with a 200 (#213)';
  }
  if (/[^\x20-\x7E]/.test(slug)) {
    return (
      'a non-ASCII character percent-encodes in the URL while the prerender writes the raw byte as ' +
      'the S3 key, so the advertised URL and the artifact stop matching (de-accent it: "código" → "codigo")'
    );
  }
  return 'expected lowercase letters, digits and single hyphens';
}

// Applies to `previousSlugs` too, and not as tidiness: a retired slug is a URL a reader is ACTUALLY on
// when the redirect has to fire, so an unusable one is worse than an unusable current slug — the article
// is reachable, and the only address anybody holds is the broken one.
function assertSlugsAreUrlSafe(resolved: Record<string, Editions>): void {
  for (const [fileSlug, editions] of Object.entries(resolved)) {
    for (const locale of LOCALES) {
      const { slug, previousSlugs } = editions[locale];
      for (const candidate of [slug, ...previousSlugs]) {
        const why = slugDefect(candidate);
        if (why === undefined) continue;
        const which = candidate === slug ? 'slug' : 'previousSlugs entry';
        throw new Error(
          `content: article "${fileSlug}" has an unusable ${locale} ${which} "${candidate}" — ${why}. ` +
            'A slug becomes a URL segment; keep it to ^[a-z0-9]+(-[a-z0-9]+)*$.',
        );
      }
    }
  }
}

/**
 * Slug uniqueness (#208). Identity is the filename KEY, but the SLUG is what every lookup resolves on —
 * `getPostBySlug`, `getEditions` and the route params all match on it, with `.find`. So a slug shared by
 * two different KEYS silently shadows: one article becomes unreachable, and the cross-locale mappers can
 * hand a reader the wrong article with no error and no not-found.
 *
 * One map covers both shapes, because they are the same defect — a slug that does not identify one
 * article: two articles sharing a slug *within* a locale, and article A's pt slug equal to article B's en
 * slug *across* locales. The SAME key reusing one slug in both editions is legal (a title that needs no
 * translation), so the comparison is against the key, not the string.
 *
 * Extracted rather than inlined into buildEditions: that function already carries the filename, locale,
 * completeness and fact-agreement contracts, and adding a fourth pushed its cognitive complexity past the
 * repo's Sonar threshold. Each contract reads better named.
 */
function assertSlugsIdentifyOneArticle(resolved: Record<string, Editions>): void {
  const slugOwner = new Map<string, string>();
  for (const [fileSlug, editions] of Object.entries(resolved)) {
    for (const locale of LOCALES) {
      // `previousSlugs` are in scope for the SAME reason the current ones are: a retired slug is resolved
      // by the same lookup, so two articles claiming one means the redirect picks a winner silently and
      // sends a reader holding a real, published URL to somebody else's article.
      for (const slug of [editions[locale].slug, ...editions[locale].previousSlugs]) {
        const owner = slugOwner.get(slug);
        if (owner !== undefined && owner !== fileSlug) {
          throw new Error(
            `content: slug "${slug}" is claimed by two different articles — "${owner}" and "${fileSlug}". ` +
              'Slugs are what every lookup resolves on, so a shared one makes an article unreachable and ' +
              'can route a reader to the wrong piece. Give each article a distinct slug in every locale.',
          );
        }
        slugOwner.set(slug, fileSlug);
      }
    }
  }
}

/**
 * A retired slug must not also be a LIVE slug — anywhere, including on the article that retired it.
 *
 * Separate from the collision check above, and the division between them is narrower than it looks — stated
 * exactly, because a guard described as catching more than it does is how the uncaught case survives a
 * review. The collision check is owner-scoped (`owner !== fileSlug`), so it already catches EVERY
 * cross-article shape, in both iteration orders. What it structurally cannot see is the SAME-article case:
 * an edition listing its own current slug as retired, where `owner === fileSlug` and the comparison is
 * silent. That is the one this guard is here for, and it is a real failure — the redirect targets the URL
 * it fired from, so the browser loops.
 *
 * The cross-article case is asserted here anyway (`content.test.ts`, against the collision message it
 * actually produces) because what matters is that it throws, not which line throws.
 */
function assertRetiredSlugsAreNotLive(resolved: Record<string, Editions>): void {
  const live = new Set<string>();
  for (const editions of Object.values(resolved)) {
    for (const locale of LOCALES) live.add(editions[locale].slug);
  }
  for (const [fileSlug, editions] of Object.entries(resolved)) {
    for (const locale of LOCALES) {
      for (const retired of editions[locale].previousSlugs) {
        if (!live.has(retired)) continue;
        throw new Error(
          `content: article "${fileSlug}" lists "${retired}" as a retired ${locale} slug, but that slug is ` +
            'still published. A retired slug becomes a redirect, so this would either loop the browser onto ' +
            'itself or shadow a live article. Remove it from previousSlugs, or stop publishing it.',
        );
      }
    }
  }
}

// Group the raw glob by slug and enforce the unpublishable contract. Exported so tests can feed it a
// synthetic set (one locale missing, a locale outside LOCALES, disagreeing facts) and assert it throws
// — the real glob below is always a complete, agreeing pair, so the throws never fire in production.
export function buildEditions(raws: Record<string, string>): Record<string, Editions> {
  const grouped = new Map<string, Partial<Record<Locale, BlogPost>>>();

  for (const [path, raw] of Object.entries(raws)) {
    const m = FILENAME.exec(path);
    if (!m) throw new Error(`content: unexpected blog filename "${path}" — expected <slug>.<locale>.md`);
    const [, fileSlug, localePart] = m;
    if (!LOCALES.includes(localePart as Locale)) {
      throw new Error(`content: "${path}" has locale "${localePart}" that is not one of ${LOCALES.join(', ')}`);
    }
    const locale = localePart as Locale;
    const editions = grouped.get(fileSlug) ?? {};
    editions[locale] = parse(fileSlug, raw);
    grouped.set(fileSlug, editions);
  }

  const resolved: Record<string, Editions> = {};
  for (const [fileSlug, editions] of grouped) {
    const missing = LOCALES.filter((l) => !editions[l]);
    if (missing.length > 0) {
      throw new Error(
        `content: blog article "${fileSlug}" is missing the ${missing.join(', ')} edition — ` +
          'every article must be authored in both languages (<slug>.pt.md and <slug>.en.md).',
      );
    }
    // Facts are authored once: assert they agree across the two editions, else it's an error.
    const [first, ...rest] = LOCALES;
    for (const locale of rest) {
      for (const key of FACT_KEYS) {
        if (editions[first]![key] !== editions[locale]![key]) {
          throw new Error(
            `content: blog article "${fileSlug}" disagrees on the fact "${key}" between its ` +
              `${first} (${String(editions[first]![key])}) and ${locale} (${String(editions[locale]![key])}) ` +
              'editions — facts are authored once and must match.',
          );
        }
      }
    }
    // The per-article OG card (#269), derived AFTER the parity check and deliberately so.
    //
    // `ogImage` is in FACT_KEYS — a fact the two editions must agree on — and a per-locale card cannot
    // agree by construction, because each edition carries its own title. Deriving it before the loop
    // would make every article throw. Deriving it here keeps the guard intact for anything an author
    // writes in frontmatter and adds the generated path afterwards.
    //
    // Keyed by `fileSlug` — the article's KEY — never by `slug`. The slug is per-locale and editable
    // after publication (ADR-0037); the key is the identity this module already treats as stable. A card
    // named after a slug orphans the day the slug is corrected, and an orphaned card is not a broken
    // image on a page: it is an `og:image` URL that 404s, which every scraper that fetched it has pinned.
    //
    // Derived rather than authored: an author who forgets the frontmatter line gets the generic card and
    // nothing objects. scripts/og-cards.test.mjs asserts a card exists for every article in both locales,
    // so the missing file fails the build instead.
    for (const locale of LOCALES) {
      editions[locale]!.ogImage = `/og/${fileSlug}.${locale}.png`;
    }
    resolved[fileSlug] = editions as Editions;
  }

  assertSlugsAreUrlSafe(resolved);
  assertSlugsIdentifyOneArticle(resolved);
  assertRetiredSlugsAreNotLive(resolved);
  return resolved;
}

const raws = import.meta.glob('../content/blog/*.{pt,en}.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const editionsBySlug = buildEditions(raws);

// Per-locale, newest first (ISO date strings sort lexicographically).
//
// THE ONE PLACE THE TWO BEHAVIOURS DIVERGE (#510). `byLocale` is the PUBLIC ENUMERATION — the index, the
// feed, the track filters, the navigation — and a held article is absent from it. `editionsBySlug` is the
// RESOLUTION index and keeps every article, held or not, which is what lets `getPostBySlug`/`getEditions`
// still render the page for the owner arriving with the preview parameter.
//
// Excluding a held article from BOTH would make the held state pointless: the URL would resolve to
// nothing and the article could never be read before publication, which is the entire feature. Excluding
// it from NEITHER would publish it. So the split is load-bearing, not an optimisation, and the two
// getters below are written against different sources on purpose rather than by drift.
const byLocale: Record<Locale, BlogPost[]> = { pt: [], en: [] };
for (const editions of Object.values(editionsBySlug)) {
  // `draft` is a FACT, so the two editions agree by construction — reading the loop's own locale rather
  // than a fixed one keeps that true if the fact check is ever relaxed, instead of half-publishing.
  for (const locale of LOCALES) if (!editions[locale].draft) byLocale[locale].push(editions[locale]);
}
for (const locale of LOCALES) {
  byLocale[locale].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getAllPosts(locale: Locale, filter?: { tag?: string; track?: Track }): BlogPost[] {
  const { tag, track } = filter ?? {};
  return byLocale[locale].filter((p) => (tag ? p.tag === tag : true) && (track ? p.track === track : true));
}

/**
 * The article published at `slug` in `locale` — INCLUDING a held one (#510).
 *
 * Resolved against `editionsBySlug`, not `byLocale`, and that is the divergence the held state is built
 * on: `getAllPosts` above enumerates what the site advertises, this one answers what the site can render.
 * A held article must be renderable at its final URL or the preview mechanism has nothing to show.
 *
 * The caller is therefore responsible for the gate. `ArticleRoute` (App.tsx) is the one caller, and it
 * redirects a held article to the locale home unless the preview parameter is present — placed in the
 * router because that is where every other conditional redirect on this site already lives, and because
 * a gate inside the page would be a redirect nobody reading the route table could see.
 *
 * Matches the CURRENT slug only. A retired slug still resolves through `supersededSlugTarget`/`getEditions`,
 * which is the same division of labour as before this field existed.
 */
export function getPostBySlug(slug: string, locale: Locale): BlogPost | undefined {
  return Object.values(editionsBySlug).find((eds) => eds[locale].slug === slug)?.[locale];
}

/**
 * The two editions of the article whose `locale` edition carries `slug`. Since slugs are per-locale
 * (ADR-0037), the lookup is unambiguous: it matches on the given locale's OWN slug, then returns the
 * whole group so callers can read the sibling locale's slug (for hreflang, the toggle, the sitemap).
 */
export function getEditions(slug: string, locale: Locale): Editions | undefined {
  return Object.values(editionsBySlug).find(
    (eds) => eds[locale].slug === slug || eds[locale].previousSlugs.includes(slug),
  );
}

/**
 * The CURRENT slug of the article that used to be published at `slug` in `locale`, or undefined when
 * `slug` is not retired (either it is live, or it is unknown).
 *
 * Deliberately NOT folded into `getPostBySlug`: the caller has to be able to tell "this is the article"
 * from "this is where the article used to be", because the two need different answers — render, versus
 * redirect so the address bar and every subsequent share carry the corrected URL. A lookup that quietly
 * resolved a retired slug to the post would leave the old URL rendering forever, which reads as working
 * and keeps the retired address in circulation.
 */
export function supersededSlugTarget(slug: string, locale: Locale): string | undefined {
  const current = getEditions(slug, locale)?.[locale].slug;
  // `current === slug` is the LIVE case, and it is compared rather than pre-checked so the "no redirect"
  // answer comes from the same lookup as the "redirect here" one — two lookups could disagree, and the
  // disagreement would be a redirect pointing at itself.
  return current === undefined || current === slug ? undefined : current;
}

/** The `to`-locale slug of the article whose `from`-locale slug is `slug`, or undefined if unknown. */
export function alternateSlug(slug: string, from: Locale, to: Locale): string | undefined {
  return getEditions(slug, from)?.[to].slug;
}

// The one place the article-path shape is defined, so the two mappers below cannot drift (#208). The
// trailing slash is OPTIONAL and deliberately so: `/blog/<slug>/` is a form browsers and link-handlers
// produce constantly, and without it that URL fell through unmapped — re-prefixed verbatim, i.e. the
// exact dead end #204 fixed, surviving on a punctuation difference.
const ARTICLE_PATH = /^\/blog\/([^/]+)\/?$/;

/** The slug in an article logical path, or undefined when the path is not an article route. */
function articleSlugOf(logicalPath: string): string | undefined {
  return ARTICLE_PATH.exec(logicalPath)?.[1];
}

/**
 * Map an article logical path across locales: `/blog/<fromSlug>` → `/blog/<toSlug>`. Any non-article
 * path (or an unknown slug) passes through unchanged, so this is safe to call on every path a locale
 * switch touches — only real article routes are rewritten. A trailing slash is accepted and normalised
 * away, so the reader lands on the canonical form.
 */
export function localizeArticlePath(logicalPath: string, from: Locale, to: Locale): string {
  const slug = articleSlugOf(logicalPath);
  if (slug === undefined) return logicalPath;
  const alt = alternateSlug(slug, from, to);
  return alt ? `/blog/${alt}` : logicalPath;
}

/**
 * Map an article path to `to`'s slug WITHOUT knowing which locale the incoming slug belongs to (#204).
 *
 * The locale toggle always knows its `from` (it is on a prefixed route), so `localizeArticlePath` fits
 * there. The unprefixed redirect does not: `/blog/<slug>` carries no prefix, and the slug may belong to
 * either edition. Re-prefixing it blindly is what dead-ended a pt-BR reader on `/pt/blog/<en-slug>` — a
 * route that does not exist — dropping them on the blog listing instead of the article.
 *
 * Tries `to` FIRST, then the other locales (#208). Order matters: a slug that is already valid in the
 * target locale is the answer that cannot be wrong, so it must win before any cross-locale guess. Trying
 * declaration order instead made resolution depend on how LOCALES happens to be written — invisible, and
 * wrong the moment two articles collide on a slug. `buildEditions` now rejects such a collision at build
 * time, so this is defence in depth rather than the only guard.
 *
 * An unknown slug passes through unchanged, keeping the in-locale not-found behaviour intact.
 */
export function articlePathForLocale(logicalPath: string, to: Locale): string {
  const slug = articleSlugOf(logicalPath);
  if (slug === undefined) return logicalPath;
  for (const from of [to, ...LOCALES.filter((l) => l !== to)]) {
    const alt = alternateSlug(slug, from, to);
    if (alt) return `/blog/${alt}`;
  }
  return logicalPath;
}
