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
// by LOOKUP in `localizedRoutes()` and FAILS if no prerendered route matches, which holds regardless of
// what the alternate set happens to contain.
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
import { localizedRoutes, SITE_URL } from './routes.mjs';

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
 * The canonical URL to share for an article, resolved by LOOKUP rather than construction.
 *
 * `routes` is the output of `localizedRoutes()`. Only those routes are prerendered, so membership in
 * that list is the property that matters — a constructed string can be well-formed and still point at
 * a URL no scraper can read OG tags from. Throws when the slug has no prerendered English route.
 */
export function shareUrlFor(routes, enSlug) {
  const route = `/blog/${enSlug}`;
  const match = routes.find((r) => r.locale === 'en' && r.route === route);
  if (!match) {
    throw new Error(
      `no prerendered English route for slug "${enSlug}" — refusing to emit a share URL that the ` +
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
 * The draft pair for one article. LinkedIn and X BOTH carry the English canonical: ADR-0024 makes
 * English the canonical edition and ADR-0037's drivers state the owner posts in English on LinkedIn.
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

/** Build every article's draft. Pure — takes the file list and route list, touches no disk. */
export function buildDrafts(files, routes, readFile) {
  const byKey = new Map();
  for (const file of files) {
    const m = /^(.+)\.(pt|en)\.md$/.exec(file);
    if (!m) continue;
    const [, key, locale] = m;
    if (locale !== 'en') continue; // English is canonical (ADR-0024) — it is what both surfaces link.
    const { frontmatter, body } = parseArticle(readFile(file));
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

function main() {
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
  const drafts = buildDrafts(files, localizedRoutes(), (f) => readFileSync(join(contentDir, f), 'utf8'));

  mkdirSync(outputDir, { recursive: true });
  const results = writeDrafts(drafts, outputDir, {
    exists: (p) => existsSync(p),
    write: (p, content) => writeFileSync(p, content, 'utf8'),
  });

  for (const r of results) {
    if (r.status === 'kept') console.log(`kept    ${r.key}.md (already exists — not overwritten)`);
    else console.log(`drafted ${r.key}.md → ${r.url}`);
  }
  const written = results.filter((r) => r.status === 'written').length;
  console.log(`\n${written} new draft(s) in ${outputDir} (gitignored — nothing is published).`);
}

// Only run as a CLI, so the unit tests can import the pure pieces.
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
