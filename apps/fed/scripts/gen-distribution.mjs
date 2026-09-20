// Distribution draft kit (#178, ADR-0038 + its amendment).
//
// ADR-0038 makes a publication "not done until it exists on both LinkedIn and X", and it deliberately
// REJECTED automating the fan-out (option 4: credentials to hold, a class of unattended public writes).
// So this posts nothing and holds no secret. It attacks the cost the ADR actually named — "two drafts
// per publication… real per-article work in a weekends-only cadence" — by scaffolding both drafts from
// the article's own frontmatter.
//
// The load-bearing part is the URL, not the prose. ADR-0037 gave articles PER-LOCALE slugs
// (/en/blog/my-commitment vs /pt/blog/meu-compromisso), and `alternatesFor()` additionally advertises a
// per-locale slug. `alternatesFor()` USED TO advertise a bare x-default article URL (/blog/<en-slug>)
// that the prerender never snapshots; #200 fixed that at the source, so hreflang now advertises only
// prerendered URLs. This generator predates the fix and does not depend on it: it resolves the draft URL
// by LOOKUP and FAILS if no prerendered route matches, which holds regardless of what the alternate set
// happens to contain.
//
// SINCE #660 THE SET IT LOOKS IN IS `neutralArticleRoutes()`, not `localizedRoutes()` — and the bare
// `/blog/<en-slug>` above is now a REAL prerendered address rather than the hazard that sentence
// describes. The invariant is the same one, read the same way: emit only what the build snapshots. What
// changed is what the build snapshots.
//
// What lookup buys over construction: a constructed string would already differ from a bare URL (no
// `/en` prefix), but only lookup catches a slug with NO prerendered route at all — unpublished, renamed,
// or typo'd. A share URL for a page that does not exist is the case worth refusing.
//
// Output goes to the gitignored `.brand/distribution/` (owner decision): pre-publication copy in a public
// repo would let anyone read tomorrow's post today. Existing files are never overwritten — the prose is
// hand-voiced after generation, and at this cadence regenerating over it buys nothing.
import { load } from 'js-yaml';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { neutralArticleRoutes, SITE_URL } from './routes.mjs';

const fedRoot = resolve(import.meta.dirname, '..');
const contentDir = join(fedRoot, 'src', 'content', 'blog');
// `.brand/` is gitignored at the REPO root, two levels up from apps/fed.
export const outputDir = resolve(fedRoot, '..', '..', '.brand', 'distribution');

/** Split a markdown file into its parsed frontmatter and its body. */
export function parseArticle(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { frontmatter: {}, body: raw };
  return { frontmatter: load(m[1]) ?? {}, body: m[2] ?? '' };
}

/** The article's `## ` section headings, in order — the beats an X thread follows. */
export function sectionHeadings(body) {
  return [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
}

/**
 * The URL to share for an article, resolved by LOOKUP rather than construction.
 *
 * `routes` is the output of `neutralArticleRoutes()` — the NEUTRAL, unprefixed share addresses
 * (#660). It was `localizedRoutes()` until then, and the change of ARGUMENT is the whole
 * change: the refusal semantics are untouched, because they never depended on which set was passed.
 *
 * WHY THE SET MOVED. `published-voice` rule 21 tells the drafter to post the neutral URL, and this
 * generator scaffolds every draft the drafter starts from. A generator emitting the locale-pinned URL
 * while the ruler asks for the neutral one is a tool and a rule disagreeing at the exact moment a human
 * is composing something irreversible — and the generator's output is the half that looks authoritative.
 *
 * WHY IT IS STILL A LOOKUP. Membership in a prerendered set is the property that matters: a constructed
 * string can be well-formed and still point at a URL no scraper can read OG tags from. That argument is
 * unchanged by the set changing — and it still catches the case construction cannot, a slug with NO
 * prerendered route at all (unpublished, renamed, or typo'd). A HELD article has no neutral route by
 * construction, so the refusal that keeps a held piece from getting a share URL keeps working untouched.
 *
 * A PT slug is still refused, and for the same reason as before rather than a new one: the neutral set
 * is keyed on the CURRENT ENGLISH SLUG, so a Portuguese slug is simply not a member of it.
 */
export function shareUrlFor(routes, enSlug) {
  const route = `/blog/${enSlug}`;
  const match = routes.find((r) => r.route === route);
  if (!match) {
    throw new Error(
      `no prerendered neutral route for slug "${enSlug}" — refusing to emit a share URL that the ` +
        `prerender never snapshotted (it would pin a generic OG card, ADR-0005)`,
    );
  }
  return `${SITE_URL}${match.url}`;
}

/**
 * Frontmatter `tag` → the hashtag line. Kept small on purpose; the owner adds their own.
 *
 * `track` is deliberately EXCLUDED even though it is right there in the frontmatter: it is an internal
 * pt-BR taxonomy used for on-site filtering (e.g. `engenharia`), and both surfaces post in English
 * (ADR-0024). Deriving from it emitted `#engenharia` under English copy — a Portuguese hashtag on an
 * English post reads as machine-generated, which is the exact impression ADR-0038 says to avoid.
 */
export function hashtagsFor(frontmatter) {
  const tags = [frontmatter.tag]
    .filter(Boolean)
    .map((t) => '#' + String(t).replace(/[^a-zA-Z0-9]+/g, ''));
  return [...LAUNCH_HASHTAGS, ...tags].join(' ');
}

/**
 * The owner's stated launch set (#178, 2026-07-26): a small, consistent set attaching every post to the
 * right subject graphs, evolving per topic but kept coherent. Deliberately a SCAFFOLD default — the
 * standard itself is still to be codified in a LinkedIn-publication-standard ADR (tracked in #178), and
 * this constant is where that decision will land rather than being scattered through the copy.
 */
export const LAUNCH_HASHTAGS = ['#AIEngineering', '#BuildInPublic', '#AgenticDevelopment'];

/**
 * The draft pair for one article. LinkedIn and X BOTH carry the NEUTRAL share URL — `/blog/<en-slug>`,
 * with no locale prefix (#660, `published-voice` rule 21).
 *
 * ~~LinkedIn and X BOTH carry the English canonical: ADR-0024 makes English the canonical edition and
 * ADR-0037's drivers state the owner posts in English on LinkedIn.~~ Struck rather than deleted, because
 * it is the sentence a reader would take the old behaviour from, and its PREMISE is still true while its
 * CONCLUSION is not. The surfaces do still carry English: the neutral URL serves the English preview to
 * an unfurler, so the card is unchanged. What changed is who decides the LANGUAGE OF THE PAGE — the
 * prefixed URL decided it for the reader, and the owner called that «erro»: a Portuguese reader followed
 * a Portuguese post and landed on English prose with no visible way back. The neutral URL hands that
 * decision to the reader's own browser while keeping one card per article.
 *
 * This emits a SCAFFOLD, not a finished post. ADR-0038 rejects syndicated identical copy because
 * "automation-shaped presence undercuts the 'written by a peer' claim" — that obligation is the
 * owner's to meet in the voicing, which is why every section is marked for rewriting rather than
 * pretending a generator can satisfy it.
 */
export function renderDraft({ key, frontmatter, headings, url }) {
  const beats = ['the hook — why this matters to the reader', ...headings, 'the link, and the ask'];
  const thread = beats.map((b, i) => `${i + 1}/ ${b}`).join('\n');

  return `# Distribution draft — ${frontmatter.title ?? key}

Generated from the article frontmatter. **Voice both sections before posting** — this is a scaffold,
not copy. ADR-0038: the two surfaces carry the same positioning, adapted to the medium, never
re-argued and never byte-identical.

Canonical URL (resolved from the prerendered route list, do not retype):
${url}

---

## LinkedIn — long form

> ${frontmatter.excerpt ?? ''}

Takeaway: ${frontmatter.takeaway ?? ''}

Read it: ${url}

${hashtagsFor(frontmatter)}

---

## X — thread

${thread}

Link in the final post: ${url}
`;
}

/**
 * Build every article's draft. Pure — takes the file list and route list, touches no disk.
 *
 * A HELD article (`draft: true`, #510) is skipped. Two independent reasons, and the second is why the
 * skip is a `continue` rather than a filter somewhere upstream:
 *  - a distribution draft is copy for LinkedIn and X, and an article that is deliberately out of the
 *    index has nothing to distribute yet — scaffolding a post for it is the opposite of holding it;
 *  - `shareUrlFor` REFUSES a slug with no prerendered neutral route, and a held article has none by
 *    construction. Without this line the generator would throw on every held draft, turning a working
 *    feature into a broken script — a real failure mode, not a hypothetical one.
 */
export function buildDrafts(files, routes, readFile) {
  const byKey = new Map();
  for (const file of files) {
    const m = /^(.+)\.(pt|en)\.md$/.exec(file);
    if (!m) continue;
    const [, key, locale] = m;
    if (locale !== 'en') continue; // English is canonical (ADR-0024) — it is what both surfaces link.
    const { frontmatter, body } = parseArticle(readFile(file));
    if (frontmatter.draft === true) continue;
    const enSlug = frontmatter.slug || key;
    byKey.set(key, {
      key,
      url: shareUrlFor(routes, enSlug),
      content: renderDraft({ key, frontmatter, headings: sectionHeadings(body), url: shareUrlFor(routes, enSlug) }),
    });
  }
  return [...byKey.values()];
}

/**
 * Write the drafts that do not exist yet, and report what happened per draft.
 *
 * NEVER overwrites: by the time a draft file exists it has been hand-voiced, and re-deriving would
 * destroy that work. A new article is a new file; a re-run is a no-op. `fs` is injected so this
 * guarantee is testable without touching the disk — an untested "we won't clobber your writing"
 * promise is exactly the kind that turns out to be false.
 */
export function writeDrafts(drafts, dir, fs) {
  const results = [];
  for (const draft of drafts) {
    const target = `${dir}/${draft.key}.md`;
    if (fs.exists(target)) {
      results.push({ key: draft.key, status: 'kept' });
      continue;
    }
    fs.write(target, draft.content);
    results.push({ key: draft.key, status: 'written', url: draft.url });
  }
  return results;
}

/**
 * The run report, as data. Extracted from `main()` so it is testable without a filesystem (#228) — and
 * because it carries the generator's one safety property: **an existing draft is never overwritten**, and
 * "kept" is the only place the reader is told that happened. A silent generator that clobbered a draft
 * the owner had already edited would look identical to one that worked.
 */
export function formatResults(results, outputDir) {
  const lines = results.map((r) =>
    r.status === 'kept'
      ? `kept    ${r.key}.md (already exists — not overwritten)`
      : `drafted ${r.key}.md → ${r.url}`,
  );
  const written = results.filter((r) => r.status === 'written').length;
  lines.push('', `${written} new draft(s) in ${outputDir} (gitignored — nothing is published).`);
  return lines;
}

function main() {
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
  const drafts = buildDrafts(files, neutralArticleRoutes(), (f) => readFileSync(join(contentDir, f), 'utf8'));

  mkdirSync(outputDir, { recursive: true });
  const results = writeDrafts(drafts, outputDir, {
    exists: (p) => existsSync(p),
    write: (p, content) => writeFileSync(p, content, 'utf8'),
  });

  for (const line of formatResults(results, outputDir)) console.log(line);
}

// Only run as a CLI, so the unit tests can import the pure pieces.
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
