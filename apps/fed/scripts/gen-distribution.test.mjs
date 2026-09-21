import { describe, expect, it } from 'vitest';
import {
  buildDrafts,
  formatResults,
  hashtagsFor,
  LANGUAGE_SEPARATOR,
  linkedInPost,
  parseArticle,
  PT_SIGNPOST,
  renderDraft,
  sectionHeadings,
  shareUrlFor,
  writeDrafts,
} from './gen-distribution.mjs';
import { neutralArticleRoutes, SITE_URL } from './routes.mjs';

// A stand-in for `neutralArticleRoutes()` output (#660): one UNPREFIXED route per article, keyed on the
// CURRENT ENGLISH slug. The Portuguese slug appears nowhere in it, which is what makes the "refuses a PT
// slug" arm below still mean something after the set changed.
const ROUTES = [
  { route: '/blog/my-commitment', url: '/blog/my-commitment' },
  { route: '/blog/what-my-agents-do', url: '/blog/what-my-agents-do' },
];

const ARTICLE = `---
title: "My Commitment"
slug: my-commitment
tag: manifesto
track: engenharia
excerpt: "The first post."
takeaway: 'what this space is.'
---
Intro paragraph.

## What I'm not going to do

Body.

## The commitment

More body.
`;

describe('parseArticle', () => {
  it('splits frontmatter from body', () => {
    const { frontmatter, body } = parseArticle(ARTICLE);
    expect(frontmatter.slug).toBe('my-commitment');
    expect(body).toContain('Intro paragraph.');
    expect(body).not.toContain('title:');
  });

  it('tolerates a file with no frontmatter', () => {
    expect(parseArticle('just text').frontmatter).toEqual({});
  });
});

describe('sectionHeadings', () => {
  it('collects the h2 beats in order', () => {
    expect(sectionHeadings(parseArticle(ARTICLE).body)).toEqual([
      "What I'm not going to do",
      'The commitment',
    ]);
  });

  it('ignores h1 and h3', () => {
    expect(sectionHeadings('# one\n### three\n## two\n')).toEqual(['two']);
  });
});

// The criterion the whole slice exists for: only `localizedRoutes()` targets plus the bare ROOT are
// prerendered, and CloudFront maps 404 → /index.html with response code 200 (iac/frontend.tf) — so any
// un-snapshotted URL answers 200 carrying the HOME page's OG card, which a scraper pins permanently
// (ADR-0005, the least reversible thing in this repo).
//
// (`alternatesFor()` used to advertise a bare x-default article URL with exactly that problem; #200
// fixed it at the source. This guard never depended on that — it constrains what THIS generator emits.)
//
// Precisely what lookup buys, since the distinction matters: string-equality against a canonicalFor()
// call WOULD also reject a bare URL (they differ by the `/en` prefix). What construction cannot catch,
// and membership can, is a slug with NO prerendered route at all — unpublished, renamed, or typo'd.
// That case is the third test below, and it is the one that would otherwise emit a share URL for a page
// that does not exist.
describe('shareUrlFor — the URL must be one the prerender actually snapshotted', () => {
  it('resolves the NEUTRAL prerendered route for a slug', () => {
    expect(shareUrlFor(ROUTES, 'my-commitment')).toBe(`${SITE_URL}/blog/my-commitment`);
  });

  // ~~'never emits the bare, unprerendered x-default article URL'~~ — INVERTED by #660, and inverted
  // rather than deleted because the property it protected is unchanged: emit only what the build
  // snapshots. The bare URL is what the build snapshots now, and the LOCALE-PINNED one is what must not
  // be emitted — it is what `published-voice` rule 21 took out of circulation, and the owner's word for
  // a reader landing on it was «erro».
  it('never emits a LOCALE-PINNED article URL — that is the address this slice retired', () => {
    const url = shareUrlFor(ROUTES, 'my-commitment');
    expect(url).not.toBe(`${SITE_URL}/en/blog/my-commitment`);
    expect(url).not.toContain('/en/');
    expect(url).not.toContain('/pt/');
  });

  it('refuses a slug with no prerendered neutral route', () => {
    expect(() => shareUrlFor(ROUTES, 'never-published')).toThrow(/no prerendered neutral route/);
  });

  // Still refused, and the reason survives the set change intact: the neutral set is keyed on the
  // CURRENT ENGLISH slug, so a Portuguese slug is simply not a member of it. This is the arm that would
  // have gone quietly green on a lookup loosened to "any route whose path ends in the slug".
  it('refuses a PT slug — the neutral address is keyed on the English slug', () => {
    expect(() => shareUrlFor(ROUTES, 'meu-compromisso')).toThrow(/no prerendered neutral route/);
  });

  it('every emitted URL is a member of the REAL neutralArticleRoutes() output', () => {
    const routes = neutralArticleRoutes();
    const prerendered = new Set(routes.map((r) => `${SITE_URL}${r.url}`));
    const files = ['my-commitment.en.md'];
    const drafts = buildDrafts(files, routes, () => ARTICLE);
    expect(drafts).toHaveLength(1);
    expect(prerendered.has(drafts[0].url)).toBe(true);
  });
});

describe('hashtagsFor', () => {
  it('leads with the owner-specified launch set, then the article tag', () => {
    expect(hashtagsFor({ tag: 'manifesto' })).toBe(
      '#AIEngineering #BuildInPublic #AgenticDevelopment #manifesto',
    );
  });

  it('omits missing fields rather than emitting empty hashtags', () => {
    expect(hashtagsFor({})).toBe('#AIEngineering #BuildInPublic #AgenticDevelopment');
  });

  // `track` is an internal pt-BR taxonomy (e.g. `engenharia`) and both surfaces post in English
  // (ADR-0024). Emitting it produced `#engenharia` under English copy — machine-generated-looking,
  // which is what ADR-0038 says to avoid. Guarded so a future "use every frontmatter field" tidy-up
  // cannot quietly reintroduce it.
  it('never derives a hashtag from the internal pt-BR track field', () => {
    expect(hashtagsFor({ tag: 'manifesto', track: 'engenharia' })).not.toContain('#engenharia');
  });
});

// #562 — the LinkedIn skeleton is BILINGUAL, and the language ORDER is the thing being pinned.
//
// The defect these arms exist for is not a wrong generator: until this slice the skeleton was
// MONOLINGUAL, so every bilingual post was assembled by hand and the order was re-decided from memory —
// and decided wrongly at least twice. An arm that only asserted "both blocks are present" would stay
// green on the exact defect (pt-first is also both blocks), which is why the ordering arm compares
// INDICES rather than counting occurrences.
describe('linkedInPost — the bilingual shape, English first', () => {
  const frontmatter = parseArticle(ARTICLE).frontmatter;
  const url = `${SITE_URL}/blog/my-commitment`;
  const post = linkedInPost({ frontmatter, url });

  it('opens with the Portuguese signpost as the FIRST line', () => {
    expect(post.split('\n')[0]).toBe('🇧🇷 Versão em português abaixo.');
    expect(PT_SIGNPOST).toBe('🇧🇷 Versão em português abaixo.');
  });

  // The owner read the line that shipped and ruled it bad: «o padrao deveria ser algo mais soft e
  // elegante do que metade». The standard is the SOFT pointer — `abaixo` — never a mechanical position.
  it('points softly and never by mechanical position', () => {
    expect(post).toContain('abaixo');
    expect(post).not.toContain('metade');
    expect(post).not.toContain('segunda metade');
  });

  // He kept «Versão» when a proposal to drop it was put to him. The word is ruled in, not incidental.
  it('keeps «Versão» — he rejected dropping it by keeping it', () => {
    expect(PT_SIGNPOST).toContain('Versão');
  });

  it('orders the English block BEFORE the separator and the Portuguese block', () => {
    const signpost = post.indexOf(PT_SIGNPOST);
    const english = post.indexOf('The first post.');
    const separator = post.indexOf(LANGUAGE_SEPARATOR);
    const portuguese = post.indexOf('excerpt em português');
    expect(signpost).toBe(0);
    expect(signpost).toBeLessThan(english);
    expect(english).toBeLessThan(separator);
    expect(separator).toBeLessThan(portuguese);
  });

  // Only ONE flag renders, which is the consequence the owner named himself: with English always
  // leading, the language hint only ever points AT Portuguese, so the 🇬🇧/🇺🇸 pin loses its object.
  it('renders exactly one flag, and it is the Brazilian one', () => {
    expect(post.match(/🇧🇷/g)).toHaveLength(1);
    expect(post).not.toContain('🇺🇸');
    expect(post).not.toContain('🇬🇧');
  });

  // The ruling on #562: LinkedIn truncates behind "see more", so the foot of a doubled-length post is
  // below the fold for every reader. The link and the tags stay at the end of the ENGLISH block.
  it('keeps the link and the hashtags at the end of the English block, above the separator', () => {
    expect(post.indexOf(`Read it: ${url}`)).toBeLessThan(post.indexOf(LANGUAGE_SEPARATOR));
    expect(post.indexOf(hashtagsFor(frontmatter))).toBeLessThan(post.indexOf(LANGUAGE_SEPARATOR));
  });

  // The generator scaffolds; it does not write his voice. Machine-translating the excerpt would put
  // words in his mouth at the one point where the output looks authoritative.
  it('leaves the Portuguese block a marked placeholder, never a translation', () => {
    expect(post).toContain('[excerpt em português');
    expect(post).toContain('NÃO traduza');
    // the English excerpt appears exactly once — it was not reused as the Portuguese block's text
    expect(post.match(/The first post\./g)).toHaveLength(1);
  });

  // The file's own refusal discipline: `shareUrlFor()` throws rather than emitting a URL the prerender
  // never snapshotted. An empty English block under a signpost PROMISING it is the same class.
  it('refuses to scaffold when the English block has no excerpt', () => {
    expect(() => linkedInPost({ frontmatter: { takeaway: 'x' }, url })).toThrow(/no "excerpt"/);
  });

  it('refuses to scaffold when the English block has no takeaway', () => {
    expect(() => linkedInPost({ frontmatter: { excerpt: 'x' }, url })).toThrow(/no "takeaway"/);
  });
});

describe('renderDraft', () => {
  const draft = renderDraft({
    key: 'my-commitment',
    frontmatter: parseArticle(ARTICLE).frontmatter,
    headings: sectionHeadings(parseArticle(ARTICLE).body),
    url: `${SITE_URL}/en/blog/my-commitment`,
  });

  it('carries both surfaces, each with the canonical URL', () => {
    expect(draft).toContain('## LinkedIn — long form');
    expect(draft).toContain('## X — thread');
    expect(draft).toContain(`${SITE_URL}/en/blog/my-commitment`);
  });

  it('builds the thread beats from the article headings, plus a hook and a close', () => {
    expect(draft).toContain("2/ What I'm not going to do");
    expect(draft).toContain('3/ The commitment');
    expect(draft).toContain('4/ the link, and the ask');
  });

  // Guards the wiring, not the shape: `linkedInPost` can be perfect and unreferenced.
  it('wires the bilingual LinkedIn body into the draft, English block first', () => {
    expect(draft).toContain(PT_SIGNPOST);
    expect(draft).toContain(LANGUAGE_SEPARATOR);
    expect(draft.indexOf('## LinkedIn')).toBeLessThan(draft.indexOf(PT_SIGNPOST));
    expect(draft.indexOf(LANGUAGE_SEPARATOR)).toBeLessThan(draft.indexOf('## X — thread'));
  });

  it('marks itself as a scaffold to be voiced, not copy to post', () => {
    expect(draft).toMatch(/Voice both sections before posting/);
  });
});

describe('buildDrafts', () => {
  it('reads only the English edition — English is canonical (ADR-0024)', () => {
    const read = (f) => {
      if (f.endsWith('.pt.md')) throw new Error('should not read the pt edition');
      return ARTICLE;
    };
    const drafts = buildDrafts(['my-commitment.en.md', 'my-commitment.pt.md'], ROUTES, read);
    expect(drafts.map((d) => d.key)).toEqual(['my-commitment']);
  });

  it('ignores files that are not per-locale articles', () => {
    expect(buildDrafts(['README.md', 'notes.txt'], ROUTES, () => ARTICLE)).toEqual([]);
  });

  // #510 — a HELD article does not enter the distribution drafts.
  //
  // Two failures ride on this one line, and the second is why the skip is inside `buildDrafts` rather
  // than in the caller. The first is intent: a distribution draft is LinkedIn and X copy, and scaffolding
  // a post for an article deliberately out of the index is the opposite of holding it. The second is
  // mechanical: `shareUrlFor` REFUSES a slug with no prerendered English route, and a held article has
  // none by construction — so without the skip the generator THROWS on every held draft and the whole
  // script stops working the day the feature is used.
  it('skips a held article rather than throwing on its missing route', () => {
    const heldArticle = ARTICLE.replace('---\n', '---\ndraft: true\n');
    expect(buildDrafts(['my-commitment.en.md'], ROUTES, () => heldArticle)).toEqual([]);
  });

  // Guards the skip from becoming a blanket: "return nothing" passes the assertion above.
  it('still drafts the published articles beside a held one', () => {
    const heldArticle = ARTICLE.replace('---\n', '---\ndraft: true\n');
    const read = (f) => (f.startsWith('held') ? heldArticle : ARTICLE);
    const drafts = buildDrafts(['held.en.md', 'my-commitment.en.md'], ROUTES, read);
    expect(drafts.map((d) => d.key)).toEqual(['my-commitment']);
  });
});

// The "we will not clobber your writing" promise. A draft is hand-voiced after generation, so an
// overwrite would destroy the only part a human made. Asserted rather than asserted-in-prose.
describe('writeDrafts', () => {
  const fakeFs = (existing = []) => {
    const written = new Map();
    const seen = new Set(existing);
    return {
      written,
      exists: (p) => seen.has(p),
      write: (p, content) => written.set(p, content),
    };
  };

  it('writes a draft that does not exist yet', () => {
    const fs = fakeFs();
    const results = writeDrafts([{ key: 'a', content: 'body', url: 'u' }], '/out', fs);
    expect(results).toEqual([{ key: 'a', status: 'written', url: 'u' }]);
    expect(fs.written.get('/out/a.md')).toBe('body');
  });

  it('never overwrites an existing draft', () => {
    const fs = fakeFs(['/out/a.md']);
    const results = writeDrafts([{ key: 'a', content: 'REGENERATED', url: 'u' }], '/out', fs);
    expect(results).toEqual([{ key: 'a', status: 'kept' }]);
    expect(fs.written.size).toBe(0);
  });

  it('writes the new ones while keeping the existing ones', () => {
    const fs = fakeFs(['/out/old.md']);
    const results = writeDrafts(
      [
        { key: 'old', content: 'X', url: 'u1' },
        { key: 'new', content: 'Y', url: 'u2' },
      ],
      '/out',
      fs,
    );
    expect(results.map((r) => r.status)).toEqual(['kept', 'written']);
    expect([...fs.written.keys()]).toEqual(['/out/new.md']);
  });
});

// The run report (#228). Extracted from main() because it carries the generator's one safety property —
// an existing draft is NEVER overwritten, and "kept" is the only place the reader is told so. A
// generator that silently clobbered a draft the owner had already edited would look identical to a
// working one, so the wording of that line is the guard.
describe('formatResults', () => {
  it('names a kept draft as not overwritten, and excludes it from the new-draft count', () => {
    const lines = formatResults(
      [
        { key: 'my-commitment', status: 'kept' },
        { key: 'second-piece', status: 'written', url: 'https://tadeumendonca.io/en/blog/second-piece' },
      ],
      '.brand/distribution',
    );
    expect(lines[0]).toContain('kept');
    expect(lines[0]).toContain('not overwritten');
    expect(lines[1]).toContain('drafted');
    expect(lines[1]).toContain('https://tadeumendonca.io/en/blog/second-piece');
    // ONE new draft, not two — a kept draft must never be counted as produced.
    expect(lines.at(-1)).toContain('1 new draft(s)');
  });

  it('reports zero when everything was kept, and still names the output directory', () => {
    const lines = formatResults([{ key: 'only', status: 'kept' }], '.brand/distribution');
    expect(lines.at(-1)).toContain('0 new draft(s)');
    expect(lines.at(-1)).toContain('.brand/distribution');
    // "nothing is published" is part of the line, not a comment: it is the reassurance that the drafts
    // stayed on the machine, and ADR-0038 makes that the generator's whole privacy claim.
    expect(lines.at(-1)).toContain('nothing is published');
  });

  it('handles an empty run without inventing output', () => {
    const lines = formatResults([], '.brand/distribution');
    expect(lines.filter((l) => l.startsWith('kept'))).toEqual([]);
    expect(lines.filter((l) => l.startsWith('drafted'))).toEqual([]);
    expect(lines.at(-1)).toContain('0 new draft(s)');
  });
});
