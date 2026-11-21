// The delivery-economics contract (#691, ADR-0055): what a snapshot must be to reach the page.
//
// EVERY REFUSAL IS PAIRED WITH THE FIXTURE PASSING, so a case cannot go red for a reason other than the one it
// names — the base fixture is asserted valid first, and each case changes exactly one thing in a fresh copy.
import { describe, it, expect } from 'vitest';
import {
  AXES,
  SnapshotError,
  deriveScorecard,
  periodBounds,
  validateSnapshot,
  type Snapshot,
} from './economicsSchema';

const metrics = () => ({
  tokens_input: { sum: null, runs: 0 },
  tokens_output: { sum: null, runs: 0 },
  credits: { sum: null, runs: 0 },
});

const card = (provider: string) => ({
  provider,
  spend: {
    state: 'pending-attestation',
    plan: null,
    basis: null,
    billing_period: null,
    amount_minor: null,
    currency: null,
    evidence_ref: null,
  },
  consumption: {
    coverage: 'none',
    runs: 0,
    native_runs: 0,
    unavailable_runs: 0,
    unrecorded_runs: 0,
    issues: 0,
    metrics: metrics(),
  },
  regime: [] as unknown[],
  allocation: { state: 'not-estimable', allocated_minor: null, shared_unallocated_minor: null, rounding_minor: null },
});

const EVIDENCE = 'https://github.com/tedeuxx/tadeumendonca-io/issues/691#issuecomment-123';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = (): any => ({
  schema_version: 1,
  method_version: '1.0.0',
  period: { id: '2026-10', start: '2026-10-01', end: '2026-10-31' },
  as_of: '2026-11-21',
  coverage_source: {
    instrument: 'worklog-export-v1',
    command: 'npm --prefix apps/fed run gen-economics -- --period 2026-10',
    export_sha256: 'a'.repeat(64),
    cutoff: '2026-11-21T00:00:00Z',
    repositories: [{ repository: 'tedeuxx/mhw', pagination_complete: false }],
    issues_in_export: 10,
    issues_refused: ['tedeuxx/mhw#128'],
    unattributed_runs: 0,
  },
  providers: [card('anthropic'), card('openai'), card('kiro')],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const attest = (s: any, amount = 10000): any => {
  s.providers[0].spend = {
    state: 'owner-attested',
    plan: 'Claude Max',
    basis: 'subscription',
    billing_period: { start: '2026-10-05', end: '2026-11-04' },
    amount_minor: amount,
    currency: 'USD',
    evidence_ref: EVIDENCE,
  };
  s.providers[0].allocation = { state: 'not-estimable', allocated_minor: null, shared_unallocated_minor: amount, rounding_minor: 0 };
  return s;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refuses = (mutate: (s: any) => void, why: RegExp) => {
  const s = base();
  mutate(s);
  expect(() => validateSnapshot(s)).toThrow(why);
};

describe('the base fixtures are admissible — every refusal below is measured against these', () => {
  it('a pending snapshot passes', () => {
    expect(validateSnapshot(base()).period.id).toBe('2026-10');
  });
  it('an attested snapshot passes', () => {
    expect(validateSnapshot(attest(base())).providers[0].spend.amount_minor).toBe(10000);
  });
  it('a no-subscription spend passes with its evidence', () => {
    const s = base();
    s.providers[2].spend = { ...s.providers[2].spend, state: 'no-subscription', evidence_ref: EVIDENCE };
    expect(validateSnapshot(s).providers[2].spend.state).toBe('no-subscription');
  });
  it('an estimable allocation that reconciles passes', () => {
    const s = attest(base());
    s.providers[0].allocation = { state: 'estimable', allocated_minor: 6000, shared_unallocated_minor: 3999, rounding_minor: 1 };
    expect(() => validateSnapshot(s)).not.toThrow();
  });
});

describe('the closed key set — the public boundary is an allowlist', () => {
  it('refuses an unknown top-level key', () => refuses((s) => (s.session_id = 'x'), /unknown key session_id/));
  it('refuses an unknown key inside a provider', () => refuses((s) => (s.providers[0].branch = 'b'), /unknown key branch/));
  it('refuses an unknown key inside spend', () => refuses((s) => (s.providers[0].spend.invoice = 'i'), /unknown key invoice/));
  it('refuses a missing key', () => refuses((s) => delete s.as_of, /missing as_of/));
  it('refuses a stored scorecard — the axis state is derived, never stored', () =>
    refuses((s) => (s.scorecard = []), /unknown key scorecard/));
  it('refuses a non-object', () => expect(() => validateSnapshot([])).toThrow(SnapshotError));
});

describe('privacy — nothing machine-local or outside the allowlist reaches the bundle', () => {
  it('refuses a local path in any string', () =>
    refuses((s) => (s.coverage_source.command = 'npm --prefix apps/fed run gen-economics -- /Users/x/e.json'), /private or machine-local/));
  it('refuses a private directory name', () =>
    refuses((s) => (s.coverage_source.command = 'npm --prefix apps/fed run gen-economics -- .brand/x'), /private or machine-local/));
  it('refuses a repository outside the allowlist', () =>
    refuses((s) => (s.coverage_source.repositories[0].repository = 'someone/private'), /must be one of/));
  it('refuses a refused-Issue reference outside the allowlist', () =>
    refuses((s) => (s.coverage_source.issues_refused = ['someone/private#1']), /must be one of/));
  it('refuses a malformed Issue reference', () => refuses((s) => (s.coverage_source.issues_refused = ['mhw 128']), /invalid value/));
  it('refuses evidence that is not a comment on #691', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].spend.evidence_ref = 'https://example.com/receipt.pdf';
    }, /evidence_ref: has an invalid value/));
  it('refuses a model identifier with spaces or slashes', () =>
    refuses((s) => (s.providers[0].regime = [{ model: 'a/b c', effort: null, runs: 1 }]), /model: has an invalid value/));
  it('refuses a command that is not the producer', () => refuses((s) => (s.coverage_source.command = 'curl x'), /producer command/));
});

describe('unknown is null, never zero', () => {
  it('refuses a zero amount on a pending spend', () => refuses((s) => (s.providers[0].spend.amount_minor = 0), /amount_minor: must be null/));
  it('refuses evidence on a pending spend', () => refuses((s) => (s.providers[0].spend.evidence_ref = EVIDENCE), /must be null while attestation is pending/));
  it('refuses a no-subscription spend without its evidence', () =>
    refuses((s) => (s.providers[2].spend.state = 'no-subscription'), /evidence_ref: has an invalid value/));
  it('refuses a zero sum where no run reported the metric', () =>
    refuses((s) => (s.providers[0].consumption.metrics.tokens_input.sum = 0), /sum must be null exactly when/));
  it('refuses a null sum where a run reported the metric', () =>
    refuses((s) => {
      Object.assign(s.providers[0].consumption, { coverage: 'complete', runs: 1, native_runs: 1, issues: 1 });
      s.providers[0].consumption.metrics.tokens_input.runs = 1;
    }, /sum must be null exactly when/));
  it('refuses a metric that is not the provider’s native unit', () =>
    refuses((s) => {
      Object.assign(s.providers[0].consumption, { coverage: 'complete', runs: 1, native_runs: 1, issues: 1 });
      s.providers[0].consumption.metrics.credits = { sum: 5, runs: 1 };
    }, /not a native unit for anthropic/));
  it('refuses amounts on a pending allocation', () =>
    refuses((s) => (s.providers[0].allocation.shared_unallocated_minor = 0), /carries amounts without an attested spend/));
  it('refuses an estimable allocation without an attested amount', () =>
    refuses((s) => {
      s.providers[0].allocation = { state: 'estimable', allocated_minor: 0, shared_unallocated_minor: null, rounding_minor: null };
    }, /cannot be estimable/));
});

describe('the counts and the coverage label agree', () => {
  it('refuses run counts that do not add up', () => refuses((s) => (s.providers[0].consumption.runs = 1), /do not add up/));
  it('refuses a coverage label the counts do not support', () =>
    refuses((s) => {
      Object.assign(s.providers[0].consumption, { runs: 2, native_runs: 1, unrecorded_runs: 1, issues: 1, coverage: 'complete' });
      s.providers[0].consumption.metrics.tokens_input = { sum: 9, runs: 1 };
    }, /must be partial/));
  it('refuses more Issues than runs', () =>
    refuses((s) => Object.assign(s.providers[0].consumption, { runs: 1, unrecorded_runs: 1, issues: 2 }), /cannot exceed runs/));
  it('refuses runs with no Issue', () =>
    refuses((s) => Object.assign(s.providers[0].consumption, { runs: 1, unrecorded_runs: 1, issues: 0 }), /zero together/));
  it('refuses a negative or fractional count', () => refuses((s) => (s.providers[0].consumption.runs = 1.5), /non-negative integer/));
  it('refuses a metric reported by more runs than were native', () =>
    refuses((s) => (s.providers[0].consumption.metrics.tokens_input = { sum: 9, runs: 1 }), /cannot exceed native runs/));
  it('refuses a duplicated regime pair and a zero-run one', () => {
    refuses((s) => (s.providers[0].regime = [{ model: 'm', effort: null, runs: 1 }, { model: 'm', effort: null, runs: 2 }]), /duplicates/);
    refuses((s) => (s.providers[0].regime = [{ model: 'm', effort: 'high', runs: 0 }]), /must be positive/);
  });
});

describe('the reconciliation — paid equals allocated plus shared/unallocated plus rounding, in minor units', () => {
  it('refuses an attested amount the allocation does not account for', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].allocation.shared_unallocated_minor = 9999;
    }, /does not reconcile/));
  it('refuses an estimable allocation that is off by one', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].allocation = { state: 'estimable', allocated_minor: 6000, shared_unallocated_minor: 4000, rounding_minor: 1 };
    }, /does not reconcile/));
  it('refuses a not-estimable allocation that allocates anyway', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].allocation.allocated_minor = 0;
    }, /must be null while not estimable/));
  it('refuses an estimable allocation with no allocated amount', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].allocation.state = 'estimable';
    }, /must be a number when estimable/));
  it('refuses an attested spend whose allocation carries no shared amount', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].allocation.shared_unallocated_minor = null;
    }, /must carry shared/));
  it('refuses a currency outside the set — there is no FX policy', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].spend.currency = 'JPY';
    }, /currency: must be one of/));
  it('refuses a billing period that ends before it starts', () =>
    refuses((s) => {
      attest(s);
      s.providers[0].spend.billing_period = { start: '2026-10-05', end: '2026-10-01' };
    }, /ends before it starts/));
});

describe('the period and its order', () => {
  it('bounds a month, leap February included', () => {
    expect(periodBounds('2026-10')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(periodBounds('2028-02')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
    expect(() => periodBounds('2026-13')).toThrow(/YYYY-MM/);
  });
  it('refuses a period whose bounds are not its month', () => refuses((s) => (s.period.end = '2026-10-30'), /must bound its month/));
  it('refuses an as_of inside the period — it has not closed', () => refuses((s) => (s.as_of = '2026-10-31'), /after the period ends/));
  it('refuses providers out of order or missing one', () => {
    refuses((s) => s.providers.reverse(), /must be anthropic at this position/);
    refuses((s) => s.providers.pop(), /must list every provider/);
  });
  it('refuses another schema version', () => refuses((s) => (s.schema_version = 2), /must be 1/));
});

describe('deriveScorecard — each of the fourteen axes in its state, in the owner’s order', () => {
  const states = (s: Snapshot) => Object.fromEntries(deriveScorecard(s).map((e) => [e.axis, e.state]));

  it('lists every axis once, in order', () => {
    expect(deriveScorecard(validateSnapshot(base())).map((e) => e.axis)).toEqual([...AXES]);
  });

  it('a period with no recorded usage: consumption and regime not measured, shared pending, one period a baseline', () => {
    const s = states(validateSnapshot(base()));
    expect(s).toMatchObject({
      aiConsumption: 'not-measured',
      regime: 'not-measured',
      coverage: 'measured',
      allocatedCost: 'not-estimable',
      sharedUnallocated: 'pending',
      baselineChange: 'not-estimable',
      movement: 'not-estimable',
      throughput: 'not-yet-instrumented',
      laborIntensity: 'not-yet-instrumented',
      flowTime: 'not-yet-instrumented',
    });
  });

  it('partial native coverage reads partial; complete reads measured', () => {
    const partial = base();
    Object.assign(partial.providers[0].consumption, { coverage: 'partial', runs: 2, native_runs: 1, unrecorded_runs: 1, issues: 1 });
    partial.providers[0].consumption.metrics.tokens_input = { sum: 9, runs: 1 };
    partial.providers[0].regime = [{ model: 'm', effort: null, runs: 1 }];
    expect(states(validateSnapshot(partial))).toMatchObject({ aiConsumption: 'partial', regime: 'partial' });

    const complete = base();
    Object.assign(complete.providers[0].consumption, { coverage: 'complete', runs: 1, native_runs: 1, issues: 1 });
    complete.providers[0].consumption.metrics.tokens_input = { sum: 9, runs: 1 };
    complete.providers[0].regime = [{ model: 'm', effort: null, runs: 1 }];
    expect(states(validateSnapshot(complete))).toMatchObject({ aiConsumption: 'measured', regime: 'measured' });
  });

  it('shared/unallocated is measured only once no provider is pending', () => {
    const s = attest(base());
    expect(states(validateSnapshot(s)).sharedUnallocated).toBe('pending');
    for (const i of [1, 2]) s.providers[i].spend = { ...s.providers[i].spend, state: 'no-subscription', evidence_ref: EVIDENCE };
    expect(states(validateSnapshot(s)).sharedUnallocated).toBe('measured');
  });

  it('allocated cost reads measured only when an allocation is estimable', () => {
    const s = attest(base());
    s.providers[0].allocation = { state: 'estimable', allocated_minor: 10000, shared_unallocated_minor: 0, rounding_minor: 0 };
    expect(states(validateSnapshot(s)).allocatedCost).toBe('measured');
  });
});
