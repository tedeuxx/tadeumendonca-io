// The /analytics page presents the event schema, and this file is what makes that presentation a
// DERIVATION rather than a transcription (#640, acceptance criterion 5).
//
// THE FAILURE IT EXISTS FOR is the one `architecture-counts.test.ts` records: a figure typed into prose
// was true the morning it was written and false the same evening, and nothing noticed for weeks. A
// hand-typed event list is the same object with more rows. So both sets are read, never written down
// here: the EMITTED set from `lib/analytics.ts`'s own source, the PRESENTED set from each edition of the
// page, and the two must be equal in BOTH directions — an event added to the code without the page fails,
// and so does a page entry with no emitter. Per event, the parameter names must match the same way.
//
// HOW THE EMITTED SET IS READ, and why it is the source text rather than the module. The schema is a set
// of TYPES (`EventParams & { slug: string }`), and types do not exist at runtime, so there is nothing to
// import and enumerate. The parse is bounded instead of trusted: every `trackEvent('<literal>'` call
// and every `'event', '<literal>'` gtag call in the module must be accounted for by a parsed emitter, so
// an emitter written in a shape this parser does not recognise reddens here instead of vanishing from
// the comparison. And no other source module may call `trackEvent` or `trackPageview` with its own
// name, so the module really is the whole of what the site emits (ESLint already keeps `window.gtag`
// inside it).
//
// WHAT IT CANNOT DO, so a green is not read as more: it checks NAMES — of events and of parameters. It
// says nothing about whether the prose under each heading is true. Those sentences are held by review.
import { describe, it, expect } from 'vitest';
import analyticsSource from '../lib/analytics.ts?raw';
import analyticsEn from './analytics.en.md?raw';
import analyticsPt from './analytics.pt.md?raw';

type Schema = Map<string, string[]>;

const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

/** The keys of a TypeScript object-type or object-literal body: `slug: string; percent: number` → slug, percent. */
const keysOf = (body: string): string[] => [...body.matchAll(/(\w+)\s*:/g)].map((m) => m[1]);

/** The parameters every custom event carries — the named members of `EventParams`, index signature excluded. */
function spineOf(source: string): string[] {
  const body = /export interface EventParams \{([\s\S]*?)\n\}/.exec(source)?.[1];
  if (body === undefined) throw new Error('analytics.ts: `export interface EventParams` not found — the parser is stale');
  return [...body.matchAll(/^\s*(\w+)\s*:/gm)].map((m) => m[1]);
}

/**
 * Event name → parameter names, read from the emitting module's source.
 *
 * Two shapes are recognised, and they are the two the module uses: a named emitter
 * (`function trackX(params: EventParams & { … }) … trackEvent('<name>', params)`), whose parameters are
 * the spine plus the intersected members; and a direct gtag call (`'event', '<name>', { … }`), whose
 * parameters are the object literal's keys. Anything else that names an event throws.
 */
function emittedSchema(source: string): Schema {
  const spine = spineOf(source);
  const schema: Schema = new Map();
  const add = (name: string, params: string[]) => {
    if (schema.has(name)) throw new Error(`analytics.ts: event \`${name}\` is emitted from two places`);
    schema.set(name, sorted(params));
  };

  const emitter =
    /export function \w+\(params: EventParams(?: & \{([^}]*)\})?\)[^{]*\{\s*(?:return )?trackEvent\('([a-z_]+)', params\)/g;
  for (const m of source.matchAll(emitter)) add(m[2], [...spine, ...keysOf(m[1] ?? '')]);

  const direct = /'event', '([a-z_]+)', \{([^}]*)\}/g;
  for (const m of source.matchAll(direct)) add(m[1], keysOf(m[2]));

  // The bound: every literal event name in the module must have been claimed by one of the two shapes.
  const literals = [
    ...[...source.matchAll(/trackEvent\('([a-z_]+)'/g)].map((m) => m[1]),
    ...[...source.matchAll(/'event', '([a-z_]+)'/g)].map((m) => m[1]),
  ];
  for (const name of literals) {
    if (!schema.has(name)) throw new Error(`analytics.ts: \`${name}\` is emitted in a shape this parser does not read`);
  }
  if (schema.size === 0) throw new Error('analytics.ts: no event parsed — the parser is stale');
  return schema;
}

/**
 * Event name → parameter names, as one edition of the page presents them: a `### \`<name>\`` heading,
 * then the first bold "parameters" line under it listing each name in backticks.
 */
function presentedSchema(body: string, paramsLabel: string): Schema {
  const schema: Schema = new Map();
  const sections = body.split(/^### /m).slice(1);
  for (const section of sections) {
    const name = /^`([a-z_]+)`\s*$/m.exec(section.split('\n')[0])?.[1];
    if (!name) continue;
    const line = new RegExp(`^\\*\\*${paramsLabel}:\\*\\* (.+)$`, 'm').exec(section)?.[1];
    if (line === undefined) throw new Error(`page: \`${name}\` has no "${paramsLabel}:" line`);
    if (schema.has(name)) throw new Error(`page: \`${name}\` is presented twice`);
    schema.set(name, sorted([...line.matchAll(/`(\w+)`/g)].map((m) => m[1])));
  }
  return schema;
}

const EDITIONS = [
  { locale: 'en', body: analyticsEn, label: 'Parameters' },
  { locale: 'pt', body: analyticsPt, label: 'Parâmetros' },
] as const;

const emitted = emittedSchema(analyticsSource);

describe('the /analytics page presents exactly the schema the code emits (#640)', () => {
  // A control on the derivation itself. If the parser silently matched nothing, or matched only half,
  // the equality below could still hold against a page that had shrunk the same way. These are facts
  // about the module that are cheap to state and would each go red on a parser that stopped reading.
  it('reads the emitting module, not an empty set', () => {
    expect(spineOf(analyticsSource)).toEqual(['locale']);
    expect(emitted.size).toBeGreaterThanOrEqual(9);
    expect(emitted.get('page_view')).toEqual(['page_path']);
    expect(emitted.get('contact_reach')).toEqual(['locale']);
  });

  it.each(EDITIONS)('$locale edition: the same event names, both directions', ({ body, label }) => {
    const presented = presentedSchema(body, label);
    const missingFromPage = sorted(emitted.keys()).filter((n) => !presented.has(n));
    const noEmitter = sorted(presented.keys()).filter((n) => !emitted.has(n));
    expect(missingFromPage, 'emitted by analytics.ts but absent from the page').toEqual([]);
    expect(noEmitter, 'presented on the page but emitted by nothing').toEqual([]);
  });

  it.each(EDITIONS)('$locale edition: the same parameter names, per event', ({ body, label }) => {
    const presented = presentedSchema(body, label);
    for (const [name, params] of emitted) {
      expect(presented.get(name), `parameters of \`${name}\``).toEqual(params);
    }
  });
});

describe('no module outside analytics.ts names an event of its own', () => {
  // The emitted set above is only the WHOLE schema if the module is the only place a name is written.
  // `trackEvent` is exported (for tests), so a call site elsewhere with a free string would emit an event
  // this page could never see. Test files are excluded: they exercise the module, they ship nothing.
  const modules = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!../lib/analytics.ts'], {
    eager: true,
    query: '?raw',
    import: 'default',
  }) as Record<string, string>;

  it('finds the source tree', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(20);
  });

  it('calls trackEvent with a literal name nowhere else', () => {
    const offenders = Object.entries(modules)
      .filter(([, src]) => /\btrackEvent\(/.test(src))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

describe('the parsers themselves', () => {
  it('rejects an emitter written in a shape it cannot read', () => {
    const src = `export interface EventParams {\n  locale: string;\n}\nfunction odd() { trackEvent('odd_event', { locale: 'x' }); }`;
    expect(() => emittedSchema(src)).toThrow(/odd_event/);
  });

  it('rejects a page entry with no parameters line', () => {
    expect(() => presentedSchema('### `x_event`\n\nprose only\n', 'Parameters')).toThrow(/x_event/);
  });
});
