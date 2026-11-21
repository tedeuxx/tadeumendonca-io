// The funnel review's per-post record (#819): validation, the post-to-session match, and the baseline
// count. The record and the collection rows are the SUBJECT; to see a red, change funnel-posts.mjs or a
// fixture line, never an assertion.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  parsePostRecord,
  validatePostRecord,
  baselineStatus,
  parseSessionRows,
  matchSessions,
  postFigures,
  piecePaths,
  slotOf,
  readBaselineDeclarations,
  readUtmVocabulary,
  main,
} from './funnel-posts.mjs';
import { AUTHOR_CAMPAIGN, SHARE_MEDIUM } from '../src/lib/utm.ts';

const repo = resolve(import.meta.dirname, '..', '..', '..');
const SITE = 'https://tadeumendonca.io';
const editions = new Map([
  ['alpha', { pt: 'alfa-pt', en: 'alpha-en' }],
  ['beta', { pt: 'beta-pt', en: 'beta-en' }],
]);
const options = {
  siteUrl: SITE,
  authorCampaign: 'author-post',
  shareMedium: 'social',
};
const tag = (source, medium = 'social') => `utm_source=${source}&utm_medium=${medium}&utm_campaign=author-post`;

const alphaPosts = [
  `post: alpha linkedin pt-en 2026-12-01 ${SITE}/blog/alpha-en?${tag('linkedin')} https://www.linkedin.com/posts/a1`,
  `post: alpha x en-pt 2026-12-01 ${SITE}/blog/alpha-en?${tag('x')} https://x.com/u/status/1`,
  `post: alpha youtube pt 2026-12-02 ${SITE}/pt/blog/alfa-pt?${tag('youtube', 'video')} https://www.youtube.com/shorts/p1`,
  `post: alpha youtube en 2026-12-02 ${SITE}/en/blog/alpha-en?${tag('youtube', 'video')} https://www.youtube.com/shorts/e1`,
];
const reachFor = (line) => `reach: ${line.split(' ').at(-1)} unread`;
const recordOf = (lines) => parsePostRecord([...lines, ...lines.map(reachFor)].join('\n'));
const problemsOf = (lines) => validatePostRecord(recordOf(lines), editions, options);
const POST_SET = ['linkedin', 'x', 'youtube:pt', 'youtube:en'];

describe('parsePostRecord', () => {
  it('reads column-0 post and reach lines and ignores prose', () => {
    const r = parsePostRecord(['# heading', ' post: indented is prose', alphaPosts[0], 'reach: https://x read'].join('\n'));
    expect(r.posts).toEqual([
      {
        piece: 'alpha',
        platform: 'linkedin',
        language: 'pt-en',
        posted: '2026-12-01',
        address: `${SITE}/blog/alpha-en?${tag('linkedin')}`,
        url: 'https://www.linkedin.com/posts/a1',
      },
    ]);
    expect(r.reach).toEqual([{ url: 'https://x', status: ['read'] }]);
    expect(r.malformed).toEqual([]);
  });

  it('keeps a post line with the wrong field count as malformed rather than dropping it', () => {
    const r = parsePostRecord('post: alpha linkedin pt-en 2026-12-01');
    expect(r.posts).toEqual([]);
    expect(validatePostRecord(r, editions, options)).toEqual(['malformed post line: post: alpha linkedin pt-en 2026-12-01']);
  });
});

describe('validatePostRecord', () => {
  it('accepts a full, well-formed post set', () => {
    expect(problemsOf(alphaPosts)).toEqual([]);
  });

  it('refuses a LinkedIn or X post whose address is not the neutral one', () => {
    const line = alphaPosts[0].replace('/blog/alpha-en', '/pt/blog/alfa-pt');
    expect(problemsOf([line])).toEqual([
      'https://www.linkedin.com/posts/a1: address path /pt/blog/alfa-pt is not /blog/alpha-en',
    ]);
  });

  it('refuses a YouTube post whose address is not the edition in its own language', () => {
    const line = alphaPosts[2].replace('/pt/blog/alfa-pt', '/blog/alpha-en');
    expect(problemsOf([line])).toEqual([
      'https://www.youtube.com/shorts/p1: address path /blog/alpha-en is not /pt/blog/alfa-pt',
    ]);
  });

  it('refuses an untagged address, and a text-post address with the wrong source or medium', () => {
    const untagged = alphaPosts[1].replace(`?${tag('x')}`, '');
    expect(problemsOf([untagged])).toEqual([
      'https://x.com/u/status/1: utm_campaign is not author-post',
      'https://x.com/u/status/1: utm_source is missing',
      'https://x.com/u/status/1: utm_medium is missing',
      'https://x.com/u/status/1: utm_source is not x',
      'https://x.com/u/status/1: utm_medium is not social',
    ]);
    const crossed = alphaPosts[0].replace(tag('linkedin'), tag('x', 'share'));
    expect(problemsOf([crossed])).toEqual([
      'https://www.linkedin.com/posts/a1: utm_source is not linkedin',
      'https://www.linkedin.com/posts/a1: utm_medium is not social',
    ]);
  });

  it('accepts any present source and medium on YouTube, whose values belong to #817, but not a missing one', () => {
    expect(problemsOf([alphaPosts[2].replace(tag('youtube', 'video'), tag('yt', 'whatever'))])).toEqual([]);
    expect(problemsOf([alphaPosts[2].replace('utm_medium=video&', '')])).toEqual([
      'https://www.youtube.com/shorts/p1: utm_medium is missing',
    ]);
  });

  it('refuses an address on another origin', () => {
    const line = alphaPosts[0].replace(SITE, 'https://example.com');
    expect(problemsOf([line])).toEqual([
      'https://www.linkedin.com/posts/a1: address https://example.com/blog/alpha-en?' + tag('linkedin') + ' is not on ' + SITE,
    ]);
  });

  it('refuses an unknown platform, an unpublished piece, and the wrong language form', () => {
    expect(problemsOf([alphaPosts[0].replace(' linkedin ', ' mastodon ')])).toEqual([
      'https://www.linkedin.com/posts/a1: platform mastodon is not one of linkedin x youtube',
    ]);
    expect(problemsOf([alphaPosts[0].replace('post: alpha', 'post: gamma')])).toEqual([
      'https://www.linkedin.com/posts/a1: piece gamma is not a published piece',
    ]);
    expect(problemsOf([alphaPosts[0].replace(' pt-en ', ' pt ')])).toEqual([
      'https://www.linkedin.com/posts/a1: language pt is not one of pt-en en-pt',
    ]);
    expect(problemsOf([alphaPosts[2].replace(' pt 2026', ' pt-en 2026')])).toEqual([
      'https://www.youtube.com/shorts/p1: language pt-en is not one of pt en',
    ]);
  });

  it('refuses a bad date, a post URL off its platform, and an unparseable URL', () => {
    expect(problemsOf([alphaPosts[0].replace('2026-12-01', '01/12/2026')])).toEqual([
      'https://www.linkedin.com/posts/a1: posted date 01/12/2026 is not YYYY-MM-DD',
    ]);
    expect(problemsOf([alphaPosts[1].replace('https://x.com/', 'https://www.linkedin.com/')])).toEqual([
      'https://www.linkedin.com/u/status/1: post URL https://www.linkedin.com/u/status/1 is not an https x address',
    ]);
    expect(problemsOf([alphaPosts[1].replace('https://x.com/u/status/1', 'not-a-url')])).toEqual([
      'not-a-url: post URL not-a-url is not a URL',
    ]);
    expect(problemsOf([alphaPosts[1].replace(`${SITE}/blog/alpha-en?${tag('x')}`, 'nope')])).toEqual([
      'https://x.com/u/status/1: address nope is not a URL',
    ]);
  });

  it('refuses the same post twice, and a second post in one slot of one piece', () => {
    expect(problemsOf([alphaPosts[0], alphaPosts[0]])).toEqual([
      'https://www.linkedin.com/posts/a1: recorded twice',
      'https://www.linkedin.com/posts/a1: a second post for alpha linkedin, which the session match cannot tell apart',
    ]);
    const second = alphaPosts[0].replace('posts/a1', 'posts/a2');
    expect(problemsOf([alphaPosts[0], second])).toEqual([
      'https://www.linkedin.com/posts/a2: a second post for alpha linkedin, which the session match cannot tell apart',
    ]);
    // Control: the same slot for ANOTHER piece is a different post.
    const beta = alphaPosts[0]
      .replace('post: alpha', 'post: beta')
      .replace('alpha-en', 'beta-en')
      .replace('posts/a1', 'posts/b1');
    expect(problemsOf([alphaPosts[0], beta])).toEqual([]);
  });

  it('requires a reach line per post, in a declared shape, naming a recorded post', () => {
    const noReach = parsePostRecord(alphaPosts[0]);
    expect(validatePostRecord(noReach, editions, options)).toEqual(['https://www.linkedin.com/posts/a1: has no reach: line']);

    const read = parsePostRecord(
      `${alphaPosts[0]}\nreach: https://www.linkedin.com/posts/a1 read 2026-12-03 owner-native-ui impressions 200`,
    );
    expect(validatePostRecord(read, editions, options)).toEqual([]);

    for (const status of [
      'read 2026-12-03 owner-native-ui impressions',
      'read 03/12 owner-native-ui impressions 200',
      'read 2026-12-03 agent impressions 200',
      'read 2026-12-03 owner-native-ui impressions many',
      'unread soon',
    ]) {
      const r = parsePostRecord(`${alphaPosts[0]}\nreach: https://www.linkedin.com/posts/a1 ${status}`);
      expect(validatePostRecord(r, editions, options), status).toEqual([
        `https://www.linkedin.com/posts/a1: reach status "${status}" is not a declared shape`,
      ]);
    }
    const orphan = parsePostRecord(`${alphaPosts[0]}\n${reachFor(alphaPosts[0])}\nreach: https://x.com/u/status/9 unread`);
    expect(validatePostRecord(orphan, editions, options)).toEqual([
      'https://x.com/u/status/9: reach: line names no recorded post',
    ]);
  });
});

describe('baselineStatus', () => {
  const posts = (lines) => parsePostRecord(lines.join('\n')).posts;

  it('counts a piece only when every slot of the post set is recorded', () => {
    const s = baselineStatus(posts(alphaPosts.slice(0, 3)), POST_SET, 3);
    expect(s.complete).toEqual([]);
    expect(s.incomplete).toEqual([{ piece: 'alpha', missing: ['youtube:en'] }]);
    expect(s.targetsAllowed).toBe(false);
    expect(baselineStatus(posts(alphaPosts), POST_SET, 3).complete).toEqual(['alpha']);
  });

  it('allows a numeric target only at the threshold', () => {
    expect(baselineStatus(posts(alphaPosts), POST_SET, 2).targetsAllowed).toBe(false);
    expect(baselineStatus(posts(alphaPosts), POST_SET, 1).targetsAllowed).toBe(true);
    expect(baselineStatus([], POST_SET, 3)).toEqual({
      complete: [],
      incomplete: [],
      threshold: 3,
      targetsAllowed: false,
    });
  });

  it('fills a text slot by platform and a video slot by platform and language', () => {
    const [li, , ytPt] = posts(alphaPosts);
    expect(slotOf(li)).toBe('linkedin');
    expect(slotOf(ytPt)).toBe('youtube:pt');
  });
});

describe('matching a post to its sessions', () => {
  const [li, x, ytPt] = parsePostRecord(alphaPosts.join('\n')).posts;
  const collection = [
    'collected: yes 2026-12-14 owner',
    'figure: ga4 sessions 30 30',
    'session-row: linkedin social author-post /blog/alpha-en pt 4',
    'session-row: linkedin social author-post /pt/blog/alfa-pt?utm_source=linkedin pt 1',
    'session-row: linkedin social author-post /blog/alpha-en en 2',
    'session-row: x social author-post /blog/alpha-en en 3',
    'session-row: linkedin social author-post /blog/beta-en pt 5',
    'session-row: linkedin social reader-share /blog/alpha-en pt 6',
    'session-row: linkedin.com referral (not-set) /blog/alpha-en pt 7',
    'session-row: youtube video author-post /pt/blog/alfa-pt pt 2',
  ].join('\n');
  const { rows, malformed } = parseSessionRows(collection);

  it('reads only column-0 session-row lines', () => {
    expect(rows).toHaveLength(8);
    expect(malformed).toEqual([]);
    expect(rows[0]).toEqual({
      source: 'linkedin',
      medium: 'social',
      campaign: 'author-post',
      landing: '/blog/alpha-en',
      locale: 'pt',
      sessions: 4,
    });
  });

  it('keeps a row with the wrong shape as malformed', () => {
    expect(parseSessionRows('session-row: linkedin social author-post /blog/alpha-en pt many').malformed).toHaveLength(1);
    expect(parseSessionRows('session-row: linkedin social /blog/alpha-en pt 3').malformed).toHaveLength(1);
  });

  it('selects the rows carrying the post address tags and landing on that piece', () => {
    const counts = (post) => matchSessions(post, rows, editions.get('alpha')).map((r) => r.sessions);
    // the neutral landing in both reader languages, and the Portuguese edition with a query string;
    // not beta's landing, not the reader-share campaign, not the untagged referral.
    expect(counts(li)).toEqual([4, 1, 2]);
    expect(counts(x)).toEqual([3]);
    expect(counts(ytPt)).toEqual([2]);
  });

  it('lists every address of a piece', () => {
    expect([...piecePaths(editions.get('alpha'))]).toEqual(['/blog/alpha-en', '/pt/blog/alfa-pt', '/en/blog/alpha-en']);
  });

  it('prints one figure per post and reader language, sampled over every session row', () => {
    expect(postFigures([li, ytPt], rows, editions)).toEqual([
      'figure: ga4 sessions_post_linkedin:alpha:pt 5 30',
      'figure: ga4 sessions_post_linkedin:alpha:en 2 30',
      'figure: ga4 sessions_post_youtube-pt:alpha:pt 2 30',
      'figure: ga4 sessions_post_youtube-pt:alpha:en 0 30',
    ]);
    const unpublished = { ...li, piece: 'gamma' };
    expect(postFigures([unpublished], rows, editions)).toEqual([]);
  });
});

describe('declarations and vocabulary readers', () => {
  it('reads the post set and the threshold, and refuses a file without them', () => {
    expect(readBaselineDeclarations('post-set: linkedin x\n\nbaseline-pieces: 3\n')).toEqual({
      postSet: ['linkedin', 'x'],
      threshold: 3,
    });
    expect(() => readBaselineDeclarations('post-set: linkedin\nbaseline-pieces: three\n')).toThrow();
    expect(() => readBaselineDeclarations('baseline-pieces: 3\n')).toThrow();
  });

  it('reads the campaign vocabulary out of utm.ts, matching what the module exports', () => {
    const source = readFileSync(join(repo, 'apps', 'fed', 'src', 'lib', 'utm.ts'), 'utf8');
    expect(readUtmVocabulary(source)).toEqual({
      authorCampaign: AUTHOR_CAMPAIGN,
      shareMedium: SHARE_MEDIUM,
    });
    expect(() => readUtmVocabulary('export const SHARE_MEDIUM = "social";')).toThrow();
  });
});

describe('the CLI', () => {
  const store = join(repo, 'docs', 'funnel-review');
  // Answer the named paths from memory and every other path from disk.
  const run = async (argv, files = {}) => {
    const out = [];
    const err = [];
    const read = (path) => files[path] ?? readFileSync(path, 'utf8');
    const code = await main(argv, {
      repo,
      read,
      out: (l) => out.push(l),
      err: (l) => err.push(l),
    });
    return { code, out, err };
  };

  it('passes on the committed record and prints the baseline count', async () => {
    const { code, out, err } = await run({});
    expect(err).toEqual([]);
    expect(code).toBe(0);
    expect(out[0]).toMatch(/^baseline: \d+ of 3 pieces fully posted; /);
  });

  it('fails on a record with a problem, prints what is missing, and prints figures for a collection', async () => {
    const blog = '/blog/my-commitment';
    const posts = [
      `post: my-commitment linkedin pt-en 2026-12-01 ${SITE}${blog}?${tag('linkedin')} https://www.linkedin.com/posts/m1`,
      'reach: https://www.linkedin.com/posts/m1 unread',
      `post: my-commitment x en-pt 2026-12-01 ${SITE}${blog} https://x.com/u/status/2`,
      'reach: https://x.com/u/status/2 unread',
    ].join('\n');
    const collection = 'period.tsv';
    const { code, out, err } = await run(
      { collection },
      {
        [join(store, 'posts.md')]: posts,
        [collection]: `session-row: linkedin social author-post ${blog} en 3\nsession-row: bad\n`,
      },
    );
    expect(code).toBe(1);
    expect(err).toContain('posts.md: https://x.com/u/status/2: utm_campaign is not author-post');
    expect(err).toContain('malformed session-row line: session-row: bad');
    expect(out).toContain('baseline: my-commitment does not count yet, missing youtube:pt youtube:en');
    expect(out).toContain('figure: ga4 sessions_post_linkedin:my-commitment:en 3 3');
    expect(out[0]).toBe('baseline: 0 of 3 pieces fully posted; no numeric target yet');
  });

  it('says a target may be set once the declared threshold is met', async () => {
    const { code, out } = await run(
      {},
      {
        [join(store, 'declarations.md')]: 'post-set: linkedin\nbaseline-pieces: 1\n',
        [join(store, 'posts.md')]:
          `post: my-commitment linkedin pt-en 2026-12-01 ${SITE}/blog/my-commitment?${tag('linkedin')} https://www.linkedin.com/posts/m1\nreach: https://www.linkedin.com/posts/m1 unread\n`,
      },
    );
    expect(code).toBe(0);
    expect(out).toEqual(['baseline: 1 of 1 pieces fully posted; a numeric target may now be set']);
  });
});
