// Ties docs/funnel-review/declarations.md to the code it describes (#765). The funnel-review rite reads
// that file to split a period's figures by piece and by language; a declaration naming a parameter the
// site no longer emits would make the rite query a dimension that collects nothing, and nothing else in
// this repository would notice. So every CODE-SIDE line is checked against the source here, and every
// GA-side line is checked for shape only — its truth lives in the analytics property, out of reach.
//
// The declarations are the SUBJECT. To see this file go red, change a declared value (or the code it
// names), never an assertion below.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as routes from './routes.mjs';
import * as funnelPosts from './funnel-posts.mjs';

const app = resolve(import.meta.dirname, '..');
const repo = resolve(app, '..', '..');
const declarationsText = readFileSync(join(repo, 'docs', 'funnel-review', 'declarations.md'), 'utf8');
const analyticsSource = readFileSync(join(app, 'src', 'lib', 'analytics.ts'), 'utf8');

const CODE_KEYS = ['piece-parameter', 'piece-parameter-absent', 'language-parameter', 'piece-key', 'neutral-share'];
const GA_KEYS = ['ga4-dimension', 'internal-traffic-filter', 'saved-exploration'];
// #819. The per-post record and the baseline rule the rite reads beside the analytics declarations.
const POST_KEYS = ['post-record', 'post-set', 'baseline-pieces'];

/** Column-0 `<key>: <value>` lines for the known keys, in file order. Anything else is prose. */
function parseDeclarations(text) {
  const known = new Set([...CODE_KEYS, ...GA_KEYS, ...POST_KEYS]);
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^([a-z0-9-]+): (.+)$/.exec(line);
    if (m && known.has(m[1])) out.push({ key: m[1], fields: m[2].trim().split(/\s+/) });
  }
  return out;
}

/**
 * event name → the extra parameter names its named emitter types, read from analytics.ts. Every named
 * emitter is `export function trackX(params: EventParams[ & { a: T; b: U }]) ... trackEvent('<name>'`.
 */
function emitterParams(source) {
  const re = /export function \w+\(params: EventParams(?: & \{([^}]*)\})?\)[^{]*\{\s*(?:return )?trackEvent\('([a-z_]+)'/g;
  const map = new Map();
  for (const [, extra = '', name] of source.matchAll(re)) {
    const names = extra
      .split(';')
      .map((part) => part.split(':')[0].trim())
      .filter(Boolean);
    map.set(name, names);
  }
  return map;
}

/** The parameters every custom event carries: the members of `interface EventParams`. */
function spineParams(source) {
  const body = /export interface EventParams \{([^}]*)\}/.exec(source)?.[1] ?? '';
  return [...body.matchAll(/^\s*([a-z_]+)\s*:/gm)].map((m) => m[1]);
}

const declarations = parseDeclarations(declarationsText);
const one = (key) => {
  const found = declarations.filter((d) => d.key === key);
  expect(found, `exactly one ${key}: line`).toHaveLength(1);
  return found[0].fields;
};
const emitters = emitterParams(analyticsSource);

describe('funnel-review declarations — the file carries every declaration', () => {
  it('has a line for each key the rite needs', () => {
    const keys = new Set(declarations.map((d) => d.key));
    for (const key of [...CODE_KEYS, ...GA_KEYS, ...POST_KEYS]) expect(keys.has(key), `${key}:`).toBe(true);
  });

  it('parses the emitters it checks against (a guard against a parser that matches nothing)', () => {
    expect(emitters.get('article_progress')).toEqual(['slug', 'percent']);
    expect(emitters.get('share_complete')).toEqual(['target']);
  });
});

describe('funnel-review declarations — code-side values match what the site emits', () => {
  it('the piece parameter is a parameter of every event declared to carry it', () => {
    const [parameter, ...events] = one('piece-parameter');
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(emitters.has(event), `an emitter for ${event}`).toBe(true);
      expect(emitters.get(event), `${event} carries ${parameter}`).toContain(parameter);
    }
  });

  it('the piece parameter is absent from every event declared not to carry it', () => {
    const [parameter] = one('piece-parameter');
    const events = one('piece-parameter-absent');
    for (const event of events) {
      expect(emitters.has(event), `an emitter for ${event}`).toBe(true);
      expect(emitters.get(event), `${event} carries no ${parameter}`).not.toContain(parameter);
      expect(spineParams(analyticsSource)).not.toContain(parameter);
    }
  });

  it('the language parameter is on the spine every event carries, with the site locales as values', () => {
    const [parameter, ...values] = one('language-parameter');
    expect(spineParams(analyticsSource)).toContain(parameter);
    expect(values).toEqual(routes.LOCALES);
  });

  it('the piece key is the content file stem, derived by the declared function in the declared module', async () => {
    const [pattern, fn, modulePath] = one('piece-key');
    const mod = await import(join(repo, modulePath));
    expect(typeof mod[fn], `${modulePath} exports ${fn}`).toBe('function');

    const m = /^(.+)\/<key>\.<locale>\.md$/.exec(pattern);
    expect(m, 'pattern is <dir>/<key>.<locale>.md').not.toBeNull();
    const dir = join(repo, m[1]);
    expect(existsSync(dir), `${m[1]} exists`).toBe(true);

    // The declared derivation, applied to the real directory, yields keys that are file stems — one per
    // article, with an edition in every declared language.
    const files = readdirSync(dir);
    const editions = mod[fn](files, (file) => readFileSync(join(dir, file), 'utf8'));
    expect(editions.size).toBeGreaterThan(0);
    const [, ...locales] = one('language-parameter');
    for (const [key, pair] of editions) {
      for (const locale of locales) {
        expect(files, `${key}.${locale}.md`).toContain(`${key}.${locale}.md`);
        expect(typeof pair[locale]).toBe('string');
      }
    }
  });

  it('the neutral share address is the declared template over each published article', () => {
    const [template, kind] = one('neutral-share');
    expect(kind).toBe('page-path');
    const m = /<([a-z]+)-slug>/.exec(template);
    expect(m, 'template names a <locale>-slug').not.toBeNull();
    const [, , modulePath] = one('piece-key');
    expect(modulePath).toBe('apps/fed/scripts/routes.mjs');

    const dir = join(app, 'src', 'content', 'blog');
    const editions = routes.buildBlogEditions(readdirSync(dir), (file) => readFileSync(join(dir, file), 'utf8'));
    const expected = [...editions.values()].map((pair) => template.replace(m[0], pair[m[1]])).sort();
    const actual = routes.neutralArticleRoutes().map((r) => r.route).sort();
    expect(actual).toEqual(expected);
  });
});

describe('funnel-review declarations — GA-side values are verified or say they are not', () => {
  it('every GA-side line carries a status in one of the two declared shapes', () => {
    const ga = declarations.filter((d) => GA_KEYS.includes(d.key));
    expect(ga.length).toBeGreaterThan(0);
    for (const { key, fields } of ga) {
      const status = key === 'ga4-dimension' ? fields.slice(1) : fields;
      const ok =
        status[0] === 'unverified' ||
        (status[0] === 'verified' &&
          /^\d{4}-\d{2}-\d{2}$/.test(status[1] ?? '') &&
          status[2] === 'owner-ga-ui' &&
          status.length > 3);
      expect(ok, `${key}: ${fields.join(' ')}`).toBe(true);
    }
  });

  it('declares a display name for the piece and the language parameters', () => {
    const named = declarations.filter((d) => d.key === 'ga4-dimension').map((d) => d.fields[0]);
    expect(named.sort()).toEqual([one('language-parameter')[0], one('piece-parameter')[0]].sort());
  });
});

describe('funnel-review declarations — the per-post record and the baseline rule (#819)', () => {
  it('names a record file and the module that reads it, and both exist', () => {
    const [record, module, ...rest] = one('post-record');
    expect(rest).toEqual([]);
    expect(existsSync(join(repo, record)), record).toBe(true);
    expect(existsSync(join(repo, module)), module).toBe(true);
    expect(module).toBe('apps/fed/scripts/funnel-posts.mjs');
  });

  it('declares a post set of slots the record can fill: a text platform alone, a video platform per language', () => {
    const set = one('post-set');
    expect(new Set(set).size).toBe(set.length);
    for (const slot of set) {
      const [platform, language] = slot.split(':');
      expect(funnelPosts.PLATFORMS, slot).toContain(platform);
      const post = { platform, language: language ?? funnelPosts.TEXT_LANGUAGES[0] };
      expect(funnelPosts.slotOf(post), slot).toBe(slot);
    }
    // The strategy's four authored posts per piece (requirements document, sections 3 and 4).
    expect([...set].sort()).toEqual(['linkedin', 'x', 'youtube:en', 'youtube:pt']);
  });

  it("states the owner's baseline: three fully posted pieces before any numeric target", () => {
    expect(one('baseline-pieces')).toEqual(['3']);
    expect(declarationsText).toMatch(/no numeric target is set until three\s+pieces have shipped/);
  });

  it('the committed record is valid against the site and the campaign vocabulary', () => {
    const [record] = one('post-record');
    const dir = join(app, 'src', 'content', 'blog');
    const editions = routes.buildBlogEditions(readdirSync(dir), (file) => readFileSync(join(dir, file), 'utf8'));
    const utm = funnelPosts.readUtmVocabulary(readFileSync(join(app, 'src', 'lib', 'utm.ts'), 'utf8'));
    const parsed = funnelPosts.parsePostRecord(readFileSync(join(repo, record), 'utf8'));
    expect(funnelPosts.validatePostRecord(parsed, editions, { siteUrl: routes.SITE_URL, ...utm })).toEqual([]);
  });
});
