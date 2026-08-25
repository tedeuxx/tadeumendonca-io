import { describe, expect, it } from 'vitest';
import {
  buildDrafts,
  formatResults,
  hashtagsFor,
  parseArticle,
  renderDraft,
  sectionHeadings,
  shareUrlFor,
  writeDrafts,
} from './gen-distribution.mjs';
import { localizedRoutes, SITE_URL } from './routes.mjs';

// A stand-in for `localizedRoutes()` output, including the pt edition with a DIFFERENT slug — the
// per-locale-slug shape ADR-0037 introduced.
const ROUTES = [
  { locale: 'en', route: '/', url: '/en' },
  { locale: 'en', route: '/blog/my-commitment', url: '/en/blog/my-commitment' },
  { locale: 'pt', route: '/blog/meu-compromisso', url: '/pt/blog/meu-compromisso' },
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
  it('resolves the English prerendered route for a slug', () => {
    expect(shareUrlFor(ROUTES, 'my-commitment')).toBe(`${SITE_URL}/en/blog/my-commitment`);
  });

  it('never emits the bare, unprerendered x-default article URL', () => {
    const url = shareUrlFor(ROUTES, 'my-commitment');
    expect(url).not.toBe(`${SITE_URL}/blog/my-commitment`);
    expect(url).toContain('/en/');
  });

  it('refuses a slug with no prerendered English route', () => {
    expect(() => shareUrlFor(ROUTES, 'never-published')).toThrow(/no prerendered English route/);
  });

  it('refuses a PT slug — the pt route exists but is not the English canonical', () => {
    expect(() => shareUrlFor(ROUTES, 'meu-compromisso')).toThrow(/no prerendered English route/);
  });

  it('every emitted URL is a member of the REAL localizedRoutes() output', () => {
    const routes = localizedRoutes();
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
