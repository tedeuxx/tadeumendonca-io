// The delivery-economics snapshot contract, version 1 (#691, ADR-0055).
//
// ONE VALIDATOR, AND IT IS THIS FILE. The producer (`scripts/economics-source.mjs`) builds a snapshot from a
// closed key set; this module decides whether a snapshot is admissible. The loader (`./economics.ts`) runs it
// at module load, so a committed snapshot that fails it fails the build and the prerender, and the data test
// runs it over every committed file. The producer's own test runs it over what the producer emits, so the two
// halves cannot disagree about the shape without a red suite.
//
// HAND-WRITTEN, NOT A SCHEMA LIBRARY. No validation library is a dependency of this app, and adding one for a
// single contract is a new dependency class (ADR-0055 records the choice). The cost is that the shape below is
// spelled twice, once as types and once as checks; the producer test is what keeps them honest.
//
// WHAT IS REFUSED, AND WHY EACH IS A REFUSAL RATHER THAN A WARNING:
//   - an unknown key at any level: the public boundary is an allowlist, so a field nobody decided to publish
//     must not ride along because it was convenient for the producer;
//   - a machine-local path or a private directory name in any string;
//   - an Issue or repository outside the allowlisted public repositories;
//   - a number where the money must reconcile and does not;
//   - zero where the contract says unknown: unknown is `null`, and a `0` that stands for "not measured" is the
//     defect this whole surface exists to prevent.

export const SCHEMA_VERSION = 1;
export const METHOD_VERSION = '1.0.0';

/** The public repositories whose Issues may be counted. Anything else is refused, never filtered. */
export const ALLOWED_REPOSITORIES = ['tedeuxx/mhw', 'tedeuxx/tadeumendonca-io'] as const;

/** The providers, in display order. Each one is always present, so an absent provider cannot read as zero. */
export const PROVIDERS = ['anthropic', 'openai', 'kiro'] as const;
export type Provider = (typeof PROVIDERS)[number];

/** The native consumption metric each provider reports through the worklog `usage` object. */
export const PROVIDER_METRICS: Record<Provider, readonly Metric[]> = {
  anthropic: ['tokens_input', 'tokens_output'],
  openai: ['tokens_input', 'tokens_output'],
  kiro: ['credits'],
};

export const METRICS = ['tokens_input', 'tokens_output', 'credits'] as const;
export type Metric = (typeof METRICS)[number];

/** Currencies with a known minor unit. No FX policy exists in method 1.0.0, so nothing is ever converted. */
export const CURRENCY_MINOR_DIGITS = { USD: 2, BRL: 2, EUR: 2 } as const;
export type Currency = keyof typeof CURRENCY_MINOR_DIGITS;

export const SPEND_STATES = ['owner-attested', 'pending-attestation', 'no-subscription'] as const;
export type SpendState = (typeof SPEND_STATES)[number];

export const COVERAGE_STATES = ['complete', 'partial', 'none'] as const;
export type CoverageState = (typeof COVERAGE_STATES)[number];

export const AXES = [
  'throughput',
  'laborIntensity',
  'aiConsumption',
  'allocatedCost',
  'aiConsumptionIntensity',
  'costIntensity',
  'flowTime',
  'qualityYield',
  'baselineChange',
  'deliveryMix',
  'regime',
  'coverage',
  'sharedUnallocated',
  'movement',
] as const;
export type Axis = (typeof AXES)[number];

export const AXIS_STATES = [
  'measured',
  'partial',
  'not-measured',
  'pending',
  'not-estimable',
  'not-yet-instrumented',
] as const;
export type AxisState = (typeof AXIS_STATES)[number];

export interface BillingPeriod {
  start: string;
  end: string;
}

export interface Spend {
  state: SpendState;
  plan: string | null;
  basis: 'subscription' | null;
  billing_period: BillingPeriod | null;
  amount_minor: number | null;
  currency: Currency | null;
  evidence_ref: string | null;
}

export interface MetricSum {
  sum: number | null;
  runs: number;
}

export interface Consumption {
  coverage: CoverageState;
  runs: number;
  native_runs: number;
  unavailable_runs: number;
  unrecorded_runs: number;
  issues: number;
  metrics: Record<Metric, MetricSum>;
}

export interface RegimeEntry {
  model: string;
  effort: string | null;
  runs: number;
}

export interface Allocation {
  state: 'estimable' | 'not-estimable';
  allocated_minor: number | null;
  shared_unallocated_minor: number | null;
  rounding_minor: number | null;
}

export interface ProviderCard {
  provider: Provider;
  spend: Spend;
  consumption: Consumption;
  regime: RegimeEntry[];
  allocation: Allocation;
}

export interface CoverageSource {
  instrument: 'worklog-export-v1';
  command: string;
  export_sha256: string;
  cutoff: string;
  repositories: { repository: string; pagination_complete: boolean }[];
  issues_in_export: number;
  issues_refused: string[];
  unattributed_runs: number;
}

export interface ScorecardEntry {
  axis: Axis;
  state: AxisState;
}

export interface Snapshot {
  schema_version: 1;
  method_version: string;
  period: { id: string; start: string; end: string };
  as_of: string;
  coverage_source: CoverageSource;
  providers: ProviderCard[];
}

/** The same family of machine-local spellings the worklog producer refuses, applied to every public string. */
export const PRIVATE_PATTERN =
  /\/tmp\/|~\/|\/var\/folders\/|\/home\/|\/Users\/|\/private\/|file:\/\/|\.brand(?![A-Za-z0-9_-])|\b[A-Za-z]:\\/i;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PERIOD_ID = /^(\d{4})-(0[1-9]|1[0-2])$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISSUE_REF = /^[^/\s]+\/[^/#\s]+#[1-9]\d*$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
/** A model or effort identifier, as the worklog contract admits one. */
export const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
/** A plan label is a vendor's product name: short, printable, no path separators. */
export const PLAN_LABEL = /^[A-Za-z0-9][A-Za-z0-9 .+()-]{0,47}$/;
/** The only place an attestation may live: an owner comment on this Issue. */
export const EVIDENCE_REF = /^https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/issues\/691#issuecomment-[1-9]\d*$/;

export class SnapshotError extends Error {}

const fail = (where: string, why: string): never => {
  throw new SnapshotError(`${where}: ${why}`);
};

type Obj = Record<string, unknown>;

function object(value: unknown, keys: readonly string[], where: string): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(where, 'must be an object');
  const obj = value as Obj;
  const extra = Object.keys(obj).filter((k) => !keys.includes(k));
  if (extra.length) fail(where, `unknown key ${extra.sort().join(', ')}`);
  const missing = keys.filter((k) => !(k in obj));
  if (missing.length) fail(where, `missing ${missing.join(', ')}`);
  return obj;
}

function count(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) fail(where, 'must be a non-negative integer');
  return value as number;
}

function nullableCount(value: unknown, where: string): number | null {
  return value === null ? null : count(value, where);
}

function str(value: unknown, pattern: RegExp, where: string): string {
  if (typeof value !== 'string' || !pattern.test(value)) fail(where, 'has an invalid value');
  return value as string;
}

function member<T extends string>(value: unknown, set: readonly T[], where: string): T {
  if (typeof value !== 'string' || !(set as readonly string[]).includes(value)) fail(where, `must be one of ${set.join(', ')}`);
  return value as T;
}

/** Every string anywhere in the snapshot, checked against the private-path pattern in one pass. */
function noPrivateStrings(value: unknown, where: string): void {
  if (typeof value === 'string') {
    if (PRIVATE_PATTERN.test(value)) fail(where, 'contains private or machine-local material');
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => noPrivateStrings(item, `${where}[${index}]`));
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) noPrivateStrings(item, `${where}.${key}`);
  }
}

/** A period id's calendar bounds: its first and last day, as YYYY-MM-DD. */
export function periodBounds(id: string): { start: string; end: string } {
  const match = PERIOD_ID.exec(id);
  if (!match) throw new SnapshotError(`period ${id}: must be YYYY-MM`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${match[1]}-${match[2]}-01`, end: `${match[1]}-${match[2]}-${String(last).padStart(2, '0')}` };
}

function validateSpend(value: unknown, where: string): void {
  const spend = object(value, ['state', 'plan', 'basis', 'billing_period', 'amount_minor', 'currency', 'evidence_ref'], where);
  const state = member(spend.state, SPEND_STATES, `${where}.state`);
  if (state === 'owner-attested') {
    str(spend.plan, PLAN_LABEL, `${where}.plan`);
    member(spend.basis, ['subscription'] as const, `${where}.basis`);
    const period = object(spend.billing_period, ['start', 'end'], `${where}.billing_period`);
    const start = str(period.start, DATE, `${where}.billing_period.start`);
    const end = str(period.end, DATE, `${where}.billing_period.end`);
    if (end < start) fail(`${where}.billing_period`, 'ends before it starts');
    count(spend.amount_minor, `${where}.amount_minor`);
    member(spend.currency, Object.keys(CURRENCY_MINOR_DIGITS) as Currency[], `${where}.currency`);
    str(spend.evidence_ref, EVIDENCE_REF, `${where}.evidence_ref`);
    return;
  }
  // Pending and no-subscription carry NO amount. A `0` here would be the exact reading the surface refuses.
  for (const key of ['plan', 'basis', 'billing_period', 'amount_minor', 'currency'] as const) {
    if (spend[key] !== null) fail(`${where}.${key}`, `must be null when the spend is ${state}`);
  }
  if (state === 'no-subscription') str(spend.evidence_ref, EVIDENCE_REF, `${where}.evidence_ref`);
  else if (spend.evidence_ref !== null) fail(`${where}.evidence_ref`, 'must be null while attestation is pending');
}

function validateConsumption(value: unknown, provider: Provider, where: string): void {
  const c = object(value, ['coverage', 'runs', 'native_runs', 'unavailable_runs', 'unrecorded_runs', 'issues', 'metrics'], where);
  const coverage = member(c.coverage, COVERAGE_STATES, `${where}.coverage`);
  const runs = count(c.runs, `${where}.runs`);
  const native = count(c.native_runs, `${where}.native_runs`);
  const unavailable = count(c.unavailable_runs, `${where}.unavailable_runs`);
  const unrecorded = count(c.unrecorded_runs, `${where}.unrecorded_runs`);
  const issues = count(c.issues, `${where}.issues`);
  if (native + unavailable + unrecorded !== runs) fail(where, 'run counts do not add up to runs');
  if (issues > runs) fail(`${where}.issues`, 'cannot exceed runs');
  if ((runs === 0) !== (issues === 0)) fail(`${where}.issues`, 'runs and issues must be zero together');
  const expected: CoverageState = native === 0 ? 'none' : native === runs ? 'complete' : 'partial';
  if (coverage !== expected) fail(`${where}.coverage`, `must be ${expected} for these counts`);
  const metrics = object(c.metrics, METRICS, `${where}.metrics`);
  for (const metric of METRICS) {
    const m = object(metrics[metric], ['sum', 'runs'], `${where}.metrics.${metric}`);
    const sum = nullableCount(m.sum, `${where}.metrics.${metric}.sum`);
    const metricRuns = count(m.runs, `${where}.metrics.${metric}.runs`);
    if (metricRuns > native) fail(`${where}.metrics.${metric}.runs`, 'cannot exceed native runs');
    // Null iff no run reported the metric: an observed sum is never invented, and an unobserved one is never 0.
    if ((sum === null) !== (metricRuns === 0)) fail(`${where}.metrics.${metric}`, 'sum must be null exactly when no run reported it');
    if (metricRuns > 0 && !PROVIDER_METRICS[provider].includes(metric)) {
      fail(`${where}.metrics.${metric}`, `is not a native unit for ${provider}`);
    }
  }
}

function validateRegime(value: unknown, where: string): void {
  if (!Array.isArray(value)) fail(where, 'must be an array');
  const seen = new Set<string>();
  (value as unknown[]).forEach((item, index) => {
    const at = `${where}[${index}]`;
    const entry = object(item, ['model', 'effort', 'runs'], at);
    const model = str(entry.model, IDENTIFIER, `${at}.model`);
    const effort = entry.effort === null ? null : str(entry.effort, IDENTIFIER, `${at}.effort`);
    if (count(entry.runs, `${at}.runs`) === 0) fail(`${at}.runs`, 'must be positive');
    const key = `${model}\u0000${effort ?? ''}`;
    if (seen.has(key)) fail(at, 'duplicates an earlier model and effort pair');
    seen.add(key);
  });
}

/**
 * The reconciliation, in integer minor units: allocated + shared/unallocated + rounding == paid, per provider.
 * While allocation is not estimable nothing is allocated, so the whole attested amount is shared/unallocated.
 */
function validateAllocation(value: unknown, spend: Spend, where: string): void {
  const a = object(value, ['state', 'allocated_minor', 'shared_unallocated_minor', 'rounding_minor'], where);
  const state = member(a.state, ['estimable', 'not-estimable'] as const, `${where}.state`);
  const allocated = nullableCount(a.allocated_minor, `${where}.allocated_minor`);
  const shared = nullableCount(a.shared_unallocated_minor, `${where}.shared_unallocated_minor`);
  const rounding = nullableCount(a.rounding_minor, `${where}.rounding_minor`);
  if (state === 'not-estimable' && allocated !== null) fail(`${where}.allocated_minor`, 'must be null while not estimable');
  if (state === 'estimable' && allocated === null) fail(`${where}.allocated_minor`, 'must be a number when estimable');
  if (spend.state !== 'owner-attested') {
    if (state === 'estimable') fail(`${where}.state`, 'cannot be estimable without an attested amount');
    if (shared !== null || rounding !== null) fail(where, 'carries amounts without an attested spend');
    return;
  }
  if (shared === null || rounding === null) fail(where, 'must carry shared/unallocated and rounding for an attested spend');
  if ((allocated ?? 0) + (shared as number) + (rounding as number) !== spend.amount_minor) {
    fail(where, 'does not reconcile with the attested amount');
  }
}

function validateCoverageSource(value: unknown, where: string): void {
  const s = object(
    value,
    ['instrument', 'command', 'export_sha256', 'cutoff', 'repositories', 'issues_in_export', 'issues_refused', 'unattributed_runs'],
    where,
  );
  member(s.instrument, ['worklog-export-v1'] as const, `${where}.instrument`);
  if (typeof s.command !== 'string' || !s.command.startsWith('npm --prefix apps/fed run gen-economics -- ')) {
    fail(`${where}.command`, 'must be the producer command');
  }
  str(s.export_sha256, SHA256, `${where}.export_sha256`);
  str(s.cutoff, UTC, `${where}.cutoff`);
  if (!Array.isArray(s.repositories) || s.repositories.length === 0) fail(`${where}.repositories`, 'must be a non-empty array');
  (s.repositories as unknown[]).forEach((item, index) => {
    const repo = object(item, ['repository', 'pagination_complete'], `${where}.repositories[${index}]`);
    member(repo.repository, ALLOWED_REPOSITORIES, `${where}.repositories[${index}].repository`);
    if (typeof repo.pagination_complete !== 'boolean') fail(`${where}.repositories[${index}].pagination_complete`, 'must be a boolean');
  });
  count(s.issues_in_export, `${where}.issues_in_export`);
  if (!Array.isArray(s.issues_refused)) fail(`${where}.issues_refused`, 'must be an array');
  (s.issues_refused as unknown[]).forEach((ref, index) => {
    const at = `${where}.issues_refused[${index}]`;
    const repo = str(ref, ISSUE_REF, at).split('#')[0];
    member(repo, ALLOWED_REPOSITORIES, `${at}.repository`);
  });
  count(s.unattributed_runs, `${where}.unattributed_runs`);
}

/** Validates a snapshot and returns it typed, or throws a `SnapshotError` naming the first violation. */
export function validateSnapshot(value: unknown, where = 'snapshot'): Snapshot {
  const s = object(value, ['schema_version', 'method_version', 'period', 'as_of', 'coverage_source', 'providers'], where);
  if (s.schema_version !== SCHEMA_VERSION) fail(`${where}.schema_version`, `must be ${SCHEMA_VERSION}`);
  str(s.method_version, /^\d+\.\d+\.\d+$/, `${where}.method_version`);
  const period = object(s.period, ['id', 'start', 'end'], `${where}.period`);
  const bounds = periodBounds(str(period.id, PERIOD_ID, `${where}.period.id`));
  if (period.start !== bounds.start || period.end !== bounds.end) fail(`${where}.period`, 'start and end must bound its month');
  const asOf = str(s.as_of, DATE, `${where}.as_of`);
  if (asOf <= bounds.end) fail(`${where}.as_of`, 'must fall after the period ends');
  validateCoverageSource(s.coverage_source, `${where}.coverage_source`);
  if (!Array.isArray(s.providers) || s.providers.length !== PROVIDERS.length) fail(`${where}.providers`, 'must list every provider');
  (s.providers as unknown[]).forEach((item, index) => {
    const at = `${where}.providers[${index}]`;
    const card = object(item, ['provider', 'spend', 'consumption', 'regime', 'allocation'], at);
    if (card.provider !== PROVIDERS[index]) fail(`${at}.provider`, `must be ${PROVIDERS[index]} at this position`);
    validateSpend(card.spend, `${at}.spend`);
    validateConsumption(card.consumption, PROVIDERS[index], `${at}.consumption`);
    validateRegime(card.regime, `${at}.regime`);
    validateAllocation(card.allocation, card.spend as Spend, `${at}.allocation`);
  });
  noPrivateStrings(value, where);
  return value as Snapshot;
}

/**
 * The fourteen scorecard axes, each in its state for this snapshot.
 *
 * DERIVED, NOT STORED. A stored state is a second statement of something the snapshot already says, and the
 * two could disagree; deriving it means a snapshot cannot claim `measured` for an axis its own numbers do not
 * support. What method 1.0.0 cannot measure is fixed here and nowhere else: when an axis gains an instrument
 * (#823, #824) this function changes in the same merge request as the method version.
 */
export function deriveScorecard(snapshot: Snapshot): ScorecardEntry[] {
  const cards = snapshot.providers;
  const native = cards.reduce((n, c) => n + c.consumption.native_runs, 0);
  const runs = cards.reduce((n, c) => n + c.consumption.runs, 0);
  const consumption: AxisState = native === 0 ? 'not-measured' : native === runs ? 'measured' : 'partial';
  const regime: AxisState = cards.some((c) => c.regime.length > 0) ? (native === runs ? 'measured' : 'partial') : 'not-measured';
  const pending = cards.some((c) => c.spend.state === 'pending-attestation');
  const allocated: AxisState = cards.every((c) => c.allocation.state === 'not-estimable') ? 'not-estimable' : 'measured';
  const state: Record<Axis, AxisState> = {
    throughput: 'not-yet-instrumented',
    laborIntensity: 'not-yet-instrumented',
    aiConsumption: consumption,
    allocatedCost: allocated,
    aiConsumptionIntensity: 'not-yet-instrumented',
    costIntensity: 'not-yet-instrumented',
    flowTime: 'not-yet-instrumented',
    qualityYield: 'not-yet-instrumented',
    // One period is a baseline: there is nothing yet to change from or move against.
    baselineChange: 'not-estimable',
    deliveryMix: 'not-yet-instrumented',
    regime,
    coverage: 'measured',
    sharedUnallocated: pending ? 'pending' : 'measured',
    movement: 'not-estimable',
  };
  return AXES.map((axis) => ({ axis, state: state[axis] }));
}
