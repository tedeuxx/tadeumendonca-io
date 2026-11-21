// The delivery-economics producer (#691, ADR-0055): what the two public inputs become in the snapshot.
//
// THE OUTPUT IS CHECKED BY THE PAGE'S OWN VALIDATOR, imported from `src/`, so the producer and the loader
// cannot disagree about the contract without this file going red. The inputs below are built the way the real
// ones arrive: an export's comments carry worklog event envelopes in their bodies, and an attestation capture
// is `gh issue view 691 --json url,comments` with author and edit fields.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { validateSnapshot } from '../src/data/economicsSchema.ts';
import {
  ProducerError,
  allocationOf,
  attestationFor,
  buildSnapshot,
  commandFor,
  consumptionOf,
  extractEvents,
  harnessKey,
  isFinal,
  minorUnits,
  periodOf,
  periodRuns,
  providerOf,
  refusedIssues,
  regimeOf,
  serialize,
} from './economics-source.mjs';

const OCT = periodOf('2026-10');
const ISSUE_URL = 'https://github.com/tedeuxx/tadeumendonca-io/issues/691';

const event = (over = {}) => ({
  event_id: `e-${Math.random()}`,
  issue: 'tedeuxx/mhw#1',
  timestamp: '2026-10-10T10:00:00Z',
  event_type: 'handoff',
  run_id: 'run-a',
  attribution: { harness: 'Claude Code' },
  revision: { repository: 'tedeuxx/mhw', branch: 'secret-branch-name', commit: 'abcdef1' },
  evidence: ['private evidence text'],
  next_act: 'resume from secret place',
  ...over,
});

const envelope = (e) => `<!-- worklog-event:v1 -->\n\`\`\`json\n${JSON.stringify(e)}\n\`\`\``;

const exportOf = (events, over = {}) => ({
  schema_version: 1,
  cutoff: '2026-11-21T00:00:00Z',
  repositories: [
    { repository: 'tedeuxx/mhw', pagination_complete: false },
    { repository: 'tedeuxx/tadeumendonca-io', pagination_complete: false },
  ],
  prior_inventory: { complete: false, comment_ids: [] },
  comments: events.map((e, i) => ({ repository: 'tedeuxx/mhw', issue: e.issue, comment_id: i + 1, body: envelope(e) })),
  ...over,
});

const attestationBody = (payload) =>
  `Spend for October.\n\n<!-- spend-attestation:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\n`;

const comment = (payload, over = {}) => ({
  url: `${ISSUE_URL}#issuecomment-${over.id ?? 9001}`,
  createdAt: over.createdAt ?? '2026-11-21T09:00:00Z',
  includesCreatedEdit: false,
  author: { login: 'tedeuxx' },
  authorAssociation: 'OWNER',
  body: attestationBody(payload),
  ...over,
});

const PAID = {
  provider: 'anthropic',
  status: 'paid',
  plan: 'Claude Max',
  basis: 'subscription',
  billing_period: { start: '2026-10-05', end: '2026-11-04' },
  amount: '100.00',
  currency: 'USD',
};

const captureOf = (...comments) => ({ url: ISSUE_URL, comments });
const NO_ATTESTATION = captureOf();

const build = (events, attestation = NO_ATTESTATION, refused = []) => {
  const data = exportOf(events);
  const text = JSON.stringify(data);
  return buildSnapshot({ periodId: '2026-10', exportData: data, exportText: text, attestationCapture: attestation, refused });
};

describe('the period', () => {
  it('is a calendar month with an open upper bound', () => {
    expect(OCT).toMatchObject({ start: '2026-10-01', end: '2026-10-31' });
    expect(OCT.until - OCT.from).toBe(31 * 86400000);
    expect(() => periodOf('2026-1')).toThrow(ProducerError);
  });

  it('counts an event on the first instant and refuses the first instant of the next month', () => {
    const runs = periodRuns(
      [
        event({ timestamp: '2026-10-01T00:00:00Z', run_id: 'first' }),
        event({ timestamp: '2026-10-31T23:59:59Z', run_id: 'last' }),
        event({ timestamp: '2026-11-01T00:00:00Z', run_id: 'next' }),
        event({ timestamp: '2026-09-30T23:59:59Z', run_id: 'prev' }),
      ],
      OCT,
    );
    expect(runs).toHaveLength(2);
  });
});

describe('harness → provider', () => {
  it('folds the harness the way the worklog does', () => {
    expect(harnessKey('Claude Code')).toBe('claudecode');
    expect(harnessKey('')).toBe('unknown');
  });
  it('maps each harness to its subscription, and nothing else', () => {
    expect(providerOf('claude-code')).toBe('anthropic');
    expect(providerOf('Codex')).toBe('openai');
    expect(providerOf('Kiro CLI')).toBe('kiro');
    expect(providerOf('Cursor')).toBeNull();
  });
  it('a run with an unmapped harness is counted as unattributed, never in a provider', () => {
    const s = build([event({ attribution: { harness: 'Cursor' } })]);
    expect(s.coverage_source.unattributed_runs).toBe(1);
    expect(s.providers.every((c) => c.consumption.runs === 0)).toBe(true);
  });
});

describe('runs and coverage', () => {
  it('groups events into runs per Issue and run id', () => {
    const runs = periodRuns(
      [event({ run_id: 'a' }), event({ run_id: 'a' }), event({ run_id: 'b' }), event({ issue: 'tedeuxx/mhw#2', run_id: 'a' })],
      OCT,
    );
    expect(runs).toHaveLength(3);
  });

  it('takes the harness of the usage-bearing event over a later one without usage', () => {
    const runs = periodRuns(
      [
        event({ usage: { usage_provenance: 'unavailable' }, attribution: { harness: 'Codex' } }),
        event({ attribution: { harness: 'Claude Code' } }),
      ],
      OCT,
    );
    expect(runs[0].provider).toBe('openai');
  });

  it('labels none, partial and complete exactly as the counts say', () => {
    const native = { usage: { usage_provenance: 'native', tokens_input: 10, tokens_output: 5 } };
    expect(consumptionOf('anthropic', [{ issue: 'x#1', usage: null }]).coverage).toBe('none');
    expect(consumptionOf('anthropic', [{ issue: 'x#1', ...native }, { issue: 'x#1', usage: null }]).coverage).toBe('partial');
    expect(consumptionOf('anthropic', [{ issue: 'x#1', ...native }]).coverage).toBe('complete');
  });

  it('separates unavailable from unrecorded, and counts distinct Issues', () => {
    const c = consumptionOf('anthropic', [
      { issue: 'x#1', usage: { usage_provenance: 'unavailable' } },
      { issue: 'x#1', usage: null },
      { issue: 'x#2', usage: null },
    ]);
    expect(c).toMatchObject({ runs: 3, native_runs: 0, unavailable_runs: 1, unrecorded_runs: 2, issues: 2 });
  });

  it('sums only what was reported: an unreported metric stays null, never zero', () => {
    const c = consumptionOf('anthropic', [
      { issue: 'x#1', usage: { usage_provenance: 'native', tokens_input: 10, tokens_output: null } },
      { issue: 'x#2', usage: { usage_provenance: 'native', tokens_input: 7 } },
    ]);
    expect(c.metrics.tokens_input).toEqual({ sum: 17, runs: 2 });
    expect(c.metrics.tokens_output).toEqual({ sum: null, runs: 0 });
    expect(c.metrics.credits).toEqual({ sum: null, runs: 0 });
  });

  it('refuses a metric that is not the provider’s native unit, and a non-integer one', () => {
    expect(() => consumptionOf('anthropic', [{ issue: 'x#1', usage: { usage_provenance: 'native', credits: 3 } }])).toThrow(
      /not a native unit for anthropic/,
    );
    expect(() => consumptionOf('kiro', [{ issue: 'x#1', usage: { usage_provenance: 'native', credits: 1.5 } }])).toThrow(
      /non-negative integer/,
    );
  });

  it('refuses a run carrying two usage records, as the worklog report does', () => {
    const u = { usage: { usage_provenance: 'unavailable' } };
    expect(() => periodRuns([event(u), event(u)], OCT)).toThrow(/more than one usage record/);
  });

  it('refuses a correction touching the period, and ignores one wholly outside it', () => {
    const correction = (timestamp, corrected) =>
      event({ event_type: 'correction', timestamp, corrected_event: { timestamp: corrected } });
    expect(() => periodRuns([correction('2026-11-02T00:00:00Z', '2026-10-15T00:00:00Z')], OCT)).toThrow(/correction touches/);
    expect(() => periodRuns([correction('2026-10-15T00:00:00Z', '2026-09-01T00:00:00Z')], OCT)).toThrow(/correction touches/);
    expect(periodRuns([correction('2026-12-01T00:00:00Z', '2026-11-15T00:00:00Z')], OCT)).toEqual([]);
  });

  it('refuses an Issue outside the allowlisted public repositories', () => {
    expect(() => periodRuns([event({ issue: 'someone/private#1' })], OCT)).toThrow(/not in an allowlisted public repository/);
  });

  it('refuses a timestamp that is not a date', () => {
    expect(() => periodRuns([event({ timestamp: 'yesterday' })], OCT)).toThrow(/not a date/);
  });
});

describe('the regime', () => {
  it('counts model and effort pairs, ordered, skipping runs that declare no model', () => {
    const r = regimeOf([
      { issue: 'x', usage: { model: 'opus', effort: 'high' } },
      { issue: 'x', usage: { model: 'opus', effort: 'high' } },
      { issue: 'x', usage: { model: 'opus' } },
      { issue: 'x', usage: { model: 'gpt', effort: 'low' } },
      { issue: 'x', usage: { usage_provenance: 'unavailable' } },
      { issue: 'x', usage: null },
    ]);
    expect(r).toEqual([
      { model: 'gpt', effort: 'low', runs: 1 },
      { model: 'opus', effort: null, runs: 1 },
      { model: 'opus', effort: 'high', runs: 2 },
    ]);
  });
  it('refuses a model that is not an identifier', () => {
    expect(() => regimeOf([{ issue: 'x', usage: { model: '/Users/me/model' } }])).toThrow(/not an identifier/);
  });
});

describe('extractEvents', () => {
  it('reads every envelope and de-duplicates by event id', () => {
    const e = event({ event_id: 'same' });
    expect(extractEvents(exportOf([e, e]))).toHaveLength(1);
  });
  it('refuses two different bodies under one event id', () => {
    expect(() => extractEvents(exportOf([event({ event_id: 'same' }), event({ event_id: 'same', run_id: 'z' })]))).toThrow(
      /two different bodies/,
    );
  });
  it('refuses an export that is not schema version 1', () => {
    expect(() => extractEvents({ schema_version: 2, comments: [] })).toThrow(/schema_version 1/);
  });
  it('refuses an envelope with invalid JSON or no event id', () => {
    const bad = { schema_version: 1, comments: [{ comment_id: 1, body: '<!-- worklog-event:v1 -->\n```json\n{nope}\n```' }] };
    expect(() => extractEvents(bad)).toThrow(/invalid worklog event JSON/);
    const noId = { schema_version: 1, comments: [{ comment_id: 1, body: envelope({ issue: 'x' }) }] };
    expect(() => extractEvents(noId)).toThrow(/without event_id/);
  });
  it('a marker quoted inside a sentence is prose, not an envelope', () => {
    const prose = { schema_version: 1, comments: [{ comment_id: 1, body: 'the <!-- worklog-event:v1 --> marker opens an event' }] };
    expect(extractEvents(prose)).toEqual([]);
  });
});

describe('the attestation — the owner’s own comment on #691, and nothing else', () => {
  it('reads a paid entry into an attested spend, in integer minor units', () => {
    const a = attestationFor(captureOf(comment({ period: '2026-10', entries: [PAID] })), OCT);
    expect(a.entries.anthropic).toEqual({
      state: 'owner-attested',
      plan: 'Claude Max',
      basis: 'subscription',
      billing_period: { start: '2026-10-05', end: '2026-11-04' },
      amount_minor: 10000,
      currency: 'USD',
      evidence_ref: `${ISSUE_URL}#issuecomment-9001`,
    });
  });

  it('a no-subscription entry carries no amount but keeps its evidence', () => {
    const a = attestationFor(captureOf(comment({ period: '2026-10', entries: [{ provider: 'kiro', status: 'no-subscription' }] })), OCT);
    expect(a.entries.kiro).toMatchObject({ state: 'no-subscription', amount_minor: null, evidence_ref: `${ISSUE_URL}#issuecomment-9001` });
  });

  it('ignores a marker posted by anyone but the owner', () => {
    const stranger = comment({ period: '2026-10', entries: [PAID] }, { author: { login: 'someone' }, authorAssociation: 'NONE' });
    expect(attestationFor(captureOf(stranger), OCT)).toBeNull();
    const collaborator = comment({ period: '2026-10', entries: [PAID] }, { authorAssociation: 'COLLABORATOR' });
    expect(attestationFor(captureOf(collaborator), OCT)).toBeNull();
  });

  it('ignores an attestation for another period, and returns null when there is none', () => {
    expect(attestationFor(captureOf(comment({ period: '2026-09', entries: [PAID] })), OCT)).toBeNull();
    expect(attestationFor(NO_ATTESTATION, OCT)).toBeNull();
  });

  it('the latest attestation for the period wins — a correction is a new comment', () => {
    const first = comment({ period: '2026-10', entries: [PAID] }, { id: 1, createdAt: '2026-11-21T09:00:00Z' });
    const second = comment({ period: '2026-10', entries: [{ ...PAID, amount: '90.00' }] }, { id: 2, createdAt: '2026-11-22T09:00:00Z' });
    const a = attestationFor(captureOf(second, first), OCT);
    expect(a.entries.anthropic.amount_minor).toBe(9000);
    expect(a.url).toBe(`${ISSUE_URL}#issuecomment-2`);
  });

  it('refuses an edited attestation — the cited URL would point at other text', () => {
    const edited = comment({ period: '2026-10', entries: [PAID] }, { includesCreatedEdit: true });
    expect(() => attestationFor(captureOf(edited), OCT)).toThrow(/edited/);
  });

  it('refuses a capture of any other Issue', () => {
    expect(() => attestationFor({ url: `${ISSUE_URL.slice(0, -3)}692`, comments: [] }, OCT)).toThrow(/not a capture/);
  });

  it('refuses an owner comment with two blocks, or invalid JSON', () => {
    const two = comment({ period: '2026-10', entries: [] });
    two.body += two.body;
    expect(() => attestationFor(captureOf(two), OCT)).toThrow(/exactly one v1 block/);
    const broken = comment({}, { body: '<!-- spend-attestation:v1 -->\n```json\n{broken}\n```' });
    expect(() => attestationFor(captureOf(broken), OCT)).toThrow(/invalid JSON/);
  });

  it('refuses a provider attested twice, an unknown provider and an unknown key', () => {
    expect(() => attestationFor(captureOf(comment({ period: '2026-10', entries: [PAID, PAID] })), OCT)).toThrow(/attested twice/);
    expect(() => attestationFor(captureOf(comment({ period: '2026-10', entries: [{ ...PAID, provider: 'acme' }] })), OCT)).toThrow(
      /provider: one of/,
    );
    expect(() => attestationFor(captureOf(comment({ period: '2026-10', entries: [{ ...PAID, account_id: '42' }] })), OCT)).toThrow(
      /unknown key account_id/,
    );
    expect(() => attestationFor(captureOf(comment({ period: '2026-10', entries: [PAID], note: 'x' })), OCT)).toThrow(/unknown key note/);
  });

  it('refuses a paid entry missing a field, a bad plan, basis, status or billing period', () => {
    const refuse = (entry, why) =>
      expect(() => attestationFor(captureOf(comment({ period: '2026-10', entries: [entry] })), OCT)).toThrow(why);
    const { plan: _plan, ...noPlan } = PAID;
    void _plan;
    refuse(noPlan, /missing plan/);
    refuse({ ...PAID, plan: 'a/b' }, /short product name/);
    refuse({ ...PAID, basis: 'api' }, /must be subscription/);
    refuse({ ...PAID, status: 'maybe' }, /paid or no-subscription/);
    refuse({ ...PAID, billing_period: { start: '2026-11-04', end: '2026-10-05' } }, /start first/);
    refuse({ ...PAID, billing_period: { start: '2026-12-01', end: '2026-12-31' } }, /does not overlap/);
    refuse({ provider: 'kiro', status: 'no-subscription', amount: '0.00' }, /unknown key amount/);
  });
});

describe('minorUnits — exact decimal conversion, no floating point', () => {
  it('converts a two-digit amount', () => {
    expect(minorUnits('100.00', 'USD')).toBe(10000);
    expect(minorUnits('0.07', 'BRL')).toBe(7);
    expect(minorUnits('19.99', 'EUR')).toBe(1999);
  });
  it('refuses the wrong number of decimals, a leading zero, a sign and an unknown currency', () => {
    expect(() => minorUnits('100', 'USD')).toThrow(/exactly 2 decimal places/);
    expect(() => minorUnits('100.0', 'USD')).toThrow(/exactly 2/);
    expect(() => minorUnits('0100.00', 'USD')).toThrow(/exactly 2/);
    expect(() => minorUnits('-1.00', 'USD')).toThrow(/exactly 2/);
    expect(() => minorUnits('1.00', 'JPY')).toThrow(/not one of/);
  });
});

describe('allocation — method 1.0.0 allocates nothing to features', () => {
  it('an attested amount is wholly shared/unallocated, and reconciles', () => {
    expect(allocationOf({ state: 'owner-attested', amount_minor: 12345 })).toEqual({
      state: 'not-estimable',
      allocated_minor: null,
      shared_unallocated_minor: 12345,
      rounding_minor: 0,
    });
  });
  it('a pending or absent spend carries no amount at all', () => {
    expect(allocationOf({ state: 'pending-attestation', amount_minor: null })).toMatchObject({ shared_unallocated_minor: null, rounding_minor: null });
    expect(allocationOf({ state: 'no-subscription', amount_minor: null }).shared_unallocated_minor).toBeNull();
  });
});

describe('refusedIssues — the export’s refusals, declared and published', () => {
  it('sorts numerically and de-duplicates', () => {
    expect(refusedIssues(['tedeuxx/mhw#257', 'tedeuxx/mhw#128', 'tedeuxx/mhw#257'])).toEqual(['tedeuxx/mhw#128', 'tedeuxx/mhw#257']);
    expect(refusedIssues(undefined)).toEqual([]);
  });
  it('refuses a reference outside the allowlist or malformed', () => {
    expect(() => refusedIssues(['someone/private#1'])).toThrow(/allowlisted/);
    expect(() => refusedIssues(['tedeuxx/mhw'])).toThrow(/allowlisted/);
  });
});

describe('buildSnapshot — the whole output', () => {
  const EVENTS = [
    event({ run_id: 'a', usage: { usage_provenance: 'native', model: 'claude-opus-5-5', effort: 'high', tokens_input: 100, tokens_output: 40 } }),
    event({ run_id: 'b', issue: 'tedeuxx/tadeumendonca-io#691' }),
    event({ run_id: 'c', attribution: { harness: 'Codex' }, usage: { usage_provenance: 'unavailable', model: 'gpt-5' } }),
  ];
  const ATTESTED = captureOf(comment({ period: '2026-10', entries: [PAID, { provider: 'kiro', status: 'no-subscription' }] }));

  it('passes the page’s own validator, attested or pending', () => {
    expect(() => validateSnapshot(build(EVENTS, ATTESTED, ['tedeuxx/mhw#128']))).not.toThrow();
    expect(() => validateSnapshot(build(EVENTS))).not.toThrow();
    expect(() => validateSnapshot(build([]))).not.toThrow();
  });

  it('carries the counts per provider, and a provider absent from the worklog still gets its card', () => {
    const s = build(EVENTS, ATTESTED);
    expect(s.providers.map((c) => c.provider)).toEqual(['anthropic', 'openai', 'kiro']);
    expect(s.providers[0].consumption).toMatchObject({ runs: 2, native_runs: 1, unrecorded_runs: 1, issues: 2, coverage: 'partial' });
    expect(s.providers[1].consumption).toMatchObject({ runs: 1, unavailable_runs: 1, coverage: 'none' });
    expect(s.providers[2].consumption.runs).toBe(0);
    expect(s.providers[1].regime).toEqual([{ model: 'gpt-5', effort: null, runs: 1 }]);
  });

  it('a provider the attestation leaves out stays pending', () => {
    const s = build(EVENTS, ATTESTED);
    expect(s.providers.map((c) => c.spend.state)).toEqual(['owner-attested', 'pending-attestation', 'no-subscription']);
    expect(isFinal(s)).toBe(false);
  });

  it('is final only when no provider is pending', () => {
    const all = captureOf(
      comment({
        period: '2026-10',
        entries: [PAID, { provider: 'openai', status: 'no-subscription' }, { provider: 'kiro', status: 'no-subscription' }],
      }),
    );
    expect(isFinal(build(EVENTS, all))).toBe(true);
    expect(isFinal(build(EVENTS))).toBe(false);
  });

  it('records the coverage source: command, export hash, cutoff, repositories and refusals', () => {
    const data = exportOf(EVENTS);
    const text = JSON.stringify(data);
    const s = buildSnapshot({ periodId: '2026-10', exportData: data, exportText: text, attestationCapture: NO_ATTESTATION, refused: ['tedeuxx/mhw#128'] });
    expect(s.coverage_source).toEqual({
      instrument: 'worklog-export-v1',
      command: commandFor('2026-10'),
      export_sha256: createHash('sha256').update(text).digest('hex'),
      cutoff: '2026-11-21T00:00:00Z',
      repositories: data.repositories,
      issues_in_export: 2,
      issues_refused: ['tedeuxx/mhw#128'],
      unattributed_runs: 0,
    });
    expect(s.as_of).toBe('2026-11-21');
  });

  it('constructs, never copies: no run id, branch, commit, evidence or next act reaches the output', () => {
    const out = serialize(build(EVENTS, ATTESTED));
    for (const leaked of ['run-a', 'secret-branch-name', 'abcdef1', 'private evidence text', 'secret place', 'Spend for October']) {
      expect(out).not.toContain(leaked);
    }
  });

  it('is deterministic: the same inputs give byte-identical output', () => {
    expect(serialize(build(EVENTS, ATTESTED))).toBe(serialize(build(EVENTS, ATTESTED)));
    expect(serialize(build(EVENTS))).toMatch(/\n$/);
  });

  it('refuses a period that has not closed, a bad cutoff, and an export with no or a foreign repository', () => {
    const run = (over) => {
      const data = exportOf(EVENTS, over);
      return () => buildSnapshot({ periodId: '2026-10', exportData: data, exportText: '', attestationCapture: NO_ATTESTATION });
    };
    expect(run({ cutoff: '2026-10-31T23:00:00Z' })).toThrow(/has not closed/);
    expect(run({ cutoff: 'soon' })).toThrow(/UTC timestamp/);
    expect(run({ repositories: [] })).toThrow(/declares no repository/);
    expect(run({ repositories: [{ repository: 'someone/private', pagination_complete: true }] })).toThrow(/not an allowlisted/);
  });
});
