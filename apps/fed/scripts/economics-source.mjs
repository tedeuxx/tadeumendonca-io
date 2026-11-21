// The decision half of the delivery-economics producer (#691, ADR-0055). `gen-economics.mjs` is the shell
// that reads two files and writes one; every choice about what reaches the public snapshot is made here.
//
// TWO INPUTS, BOTH PUBLIC, NEITHER FETCHED HERE:
//
//   A · spend, attested by the owner in a comment on #691 — the saved stdout of
//       `gh issue view 691 --repo tedeuxx/tadeumendonca-io --json url,comments`. Only a comment the owner
//       authored counts, its marker block is the whole of the evidence, and its URL becomes `evidence_ref`.
//       No receipt, invoice or billing console is read by anything, and no credential exists in this path.
//   B · observed consumption — the JSON a `worklog.py export` composes from saved Issue captures. This file
//       depends on that export's `schema_version: 1` contract and on the worklog event's `usage` object, never
//       on the script's location on any machine.
//
// THE OUTPUT IS CONSTRUCTED, NEVER COPIED. Every field of the snapshot is assigned from a closed key set
// below. Run ids, session ids, branches, commit SHAs, evidence text, `next_act` and comment bodies are read
// only to the extent a count needs them and none of them is written out.
//
// IT REFUSES RATHER THAN GUESSES, in the worklog's own manner: a correction event inside the period, a run with
// two usage records, an Issue outside the allowlist, an edited attestation or an ambiguous one all throw. A
// refusal costs the owner one re-run; a guess would publish a number nobody can reproduce.
import { createHash } from 'node:crypto';

export const SCHEMA_VERSION = 1;
export const METHOD_VERSION = '1.0.0';
export const OWNER_LOGIN = 'tedeuxx';
export const ATTESTATION_ISSUE_URL = 'https://github.com/tedeuxx/tadeumendonca-io/issues/691';
export const ALLOWED_REPOSITORIES = ['tedeuxx/mhw', 'tedeuxx/tadeumendonca-io'];
export const PROVIDERS = ['anthropic', 'openai', 'kiro'];
export const METRICS = ['tokens_input', 'tokens_output', 'credits'];
export const PROVIDER_METRICS = {
  anthropic: ['tokens_input', 'tokens_output'],
  openai: ['tokens_input', 'tokens_output'],
  kiro: ['credits'],
};
export const CURRENCY_MINOR_DIGITS = { USD: 2, BRL: 2, EUR: 2 };

const EVENT_RE = /^<!-- worklog-event:v1 -->[ \t]*\r?\n\s*```json\s*(\{.*?\})\s*```/gms;
const ATTESTATION_RE = /^<!-- spend-attestation:v1 -->[ \t]*\r?\n\s*```json\s*(\{.*?\})\s*```/gms;
const ATTESTATION_MARKER = /<!-- spend-attestation:v/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const PLAN_LABEL = /^[A-Za-z0-9][A-Za-z0-9 .+()-]{0,47}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PERIOD_ID = /^(\d{4})-(0[1-9]|1[0-2])$/;
const COMMENT_URL = /^https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/issues\/691#issuecomment-[1-9]\d*$/;

export class ProducerError extends Error {}

const fail = (message) => {
  throw new ProducerError(message);
};

/** The calendar month a period id names, and the instant the next one starts (the filter's open bound). */
export function periodOf(id) {
  const match = PERIOD_ID.exec(id ?? '');
  if (!match) fail(`period ${id}: must be YYYY-MM`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    id,
    start: `${match[1]}-${match[2]}-01`,
    end: `${match[1]}-${match[2]}-${String(last).padStart(2, '0')}`,
    from: Date.UTC(year, month - 1, 1),
    until: Date.UTC(year, month, 1),
  };
}

/** The worklog's own cohort key for a free-text harness (`Claude Code`, `claude-code` → `claudecode`). */
export const harnessKey = (value) => String(value ?? '').toLowerCase().replace(/[^0-9a-z]/g, '') || 'unknown';

/** Which provider's subscription a harness runs on, or null when it maps to none. */
export function providerOf(harness) {
  const key = harnessKey(harness);
  if (key === 'claudecode' || key === 'claude') return 'anthropic';
  if (key === 'codex' || key === 'codexcli') return 'openai';
  if (key.startsWith('kiro')) return 'kiro';
  return null;
}

/** Every worklog event in the export, de-duplicated by `event_id`. A conflicting duplicate throws. */
export function extractEvents(exportData) {
  if (!exportData || exportData.schema_version !== 1 || !Array.isArray(exportData.comments)) {
    fail('export: not a worklog export with schema_version 1');
  }
  const byId = new Map();
  for (const comment of exportData.comments) {
    for (const match of String(comment.body ?? '').matchAll(EVENT_RE)) {
      let event;
      try {
        event = JSON.parse(match[1]);
      } catch {
        fail(`comment ${comment.comment_id}: invalid worklog event JSON`);
      }
      if (typeof event.event_id !== 'string' || !event.event_id) fail(`comment ${comment.comment_id}: event without event_id`);
      const prior = byId.get(event.event_id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(event)) fail(`event ${event.event_id}: two different bodies`);
      byId.set(event.event_id, event);
    }
  }
  return [...byId.values()];
}

const inPeriod = (stamp, period) => {
  const at = Date.parse(stamp);
  if (Number.isNaN(at)) fail(`timestamp ${stamp}: not a date`);
  return at >= period.from && at < period.until;
};

function repositoryOf(issue) {
  const repo = String(issue ?? '').split('#')[0];
  if (!ALLOWED_REPOSITORIES.includes(repo)) fail(`issue ${issue}: not in an allowlisted public repository`);
  return repo;
}

/** One coverage unit per run on an Issue inside the period: its provider, and its usage record or null. */
export function periodRuns(events, period) {
  const runs = new Map();
  for (const event of events) {
    if (event.event_type === 'correction') {
      const corrected = event.corrected_event?.timestamp;
      if (inPeriod(event.timestamp, period) || (corrected && inPeriod(corrected, period))) {
        fail(`event ${event.event_id}: a correction touches this period; method ${METHOD_VERSION} does not apply corrections`);
      }
      continue;
    }
    if (!inPeriod(event.timestamp, period)) continue;
    repositoryOf(event.issue);
    const key = `${event.issue} ${event.run_id}`;
    const run = runs.get(key) ?? { issue: event.issue, harness: null, usage: null };
    if (event.usage) {
      if (run.usage) fail(`${event.issue}: run carries more than one usage record`);
      run.usage = event.usage;
      run.harness = event.attribution?.harness ?? null;
    } else if (!run.usage) {
      run.harness = event.attribution?.harness ?? null;
    }
    runs.set(key, run);
  }
  return [...runs.values()].map((run) => ({ ...run, provider: providerOf(run.harness) }));
}

function emptyMetrics() {
  return Object.fromEntries(METRICS.map((metric) => [metric, { sum: null, runs: 0 }]));
}

/** The worklog's coverage vocabulary, applied to one provider's runs. Sums are of what was reported, never an estimate. */
export function consumptionOf(provider, runs) {
  const native = runs.filter((run) => run.usage?.usage_provenance === 'native');
  const unavailable = runs.filter((run) => run.usage?.usage_provenance === 'unavailable').length;
  const unrecorded = runs.filter((run) => !run.usage).length;
  const metrics = emptyMetrics();
  for (const run of native) {
    for (const metric of METRICS) {
      const value = run.usage[metric];
      if (value === null || value === undefined) continue;
      if (!PROVIDER_METRICS[provider].includes(metric)) fail(`${run.issue}: ${metric} is not a native unit for ${provider}`);
      if (!Number.isSafeInteger(value) || value < 0) fail(`${run.issue}: ${metric} must be a non-negative integer`);
      metrics[metric] = { sum: (metrics[metric].sum ?? 0) + value, runs: metrics[metric].runs + 1 };
    }
  }
  return {
    coverage: native.length === 0 ? 'none' : native.length === runs.length ? 'complete' : 'partial',
    runs: runs.length,
    native_runs: native.length,
    unavailable_runs: unavailable,
    unrecorded_runs: unrecorded,
    issues: new Set(runs.map((run) => run.issue)).size,
    metrics,
  };
}

/** The model/effort regime the usage records declare, counted per pair and ordered for a stable output. */
export function regimeOf(runs) {
  const counts = new Map();
  for (const run of runs) {
    const model = run.usage?.model;
    if (model === undefined || model === null) continue;
    const effort = run.usage.effort ?? null;
    if (!IDENTIFIER.test(model) || (effort !== null && !IDENTIFIER.test(effort))) {
      fail(`${run.issue}: model or effort is not an identifier`);
    }
    const key = `${model}\u0000${effort ?? ''}`;
    const entry = counts.get(key) ?? { model, effort, runs: 0 };
    entry.runs += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) =>
    a.model === b.model ? (a.effort ?? '').localeCompare(b.effort ?? '') : a.model.localeCompare(b.model),
  );
}

/** A decimal string in a currency's minor digits → an integer of minor units, exactly. `"12.30"` → 1230. */
export function minorUnits(amount, currency) {
  const digits = CURRENCY_MINOR_DIGITS[currency];
  if (digits === undefined) fail(`currency ${currency}: not one of ${Object.keys(CURRENCY_MINOR_DIGITS).join(', ')}`);
  const pattern = digits === 0 ? /^(0|[1-9]\d*)$/ : new RegExp(`^(0|[1-9]\\d*)\\.(\\d{${digits}})$`);
  const match = pattern.exec(String(amount));
  if (!match) fail(`amount ${amount}: must be a decimal string with exactly ${digits} decimal places`);
  return Number(match[1]) * 10 ** digits + Number(match[2] ?? 0);
}

const PAID_KEYS = ['provider', 'status', 'plan', 'basis', 'billing_period', 'amount', 'currency'];
const NONE_KEYS = ['provider', 'status'];

function exactKeys(obj, keys, where) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) fail(`${where}: must be an object`);
  const extra = Object.keys(obj).filter((key) => !keys.includes(key));
  const missing = keys.filter((key) => !(key in obj));
  if (extra.length) fail(`${where}: unknown key ${extra.sort().join(', ')}`);
  if (missing.length) fail(`${where}: missing ${missing.join(', ')}`);
}

/** One attested entry → the snapshot's `spend` object. */
export function spendOf(entry, evidenceRef, period, where) {
  if (entry.status === 'no-subscription') {
    exactKeys(entry, NONE_KEYS, where);
    return { state: 'no-subscription', plan: null, basis: null, billing_period: null, amount_minor: null, currency: null, evidence_ref: evidenceRef };
  }
  if (entry.status !== 'paid') fail(`${where}.status: must be paid or no-subscription`);
  exactKeys(entry, PAID_KEYS, where);
  if (typeof entry.plan !== 'string' || !PLAN_LABEL.test(entry.plan)) fail(`${where}.plan: a short product name`);
  if (entry.basis !== 'subscription') fail(`${where}.basis: must be subscription`);
  exactKeys(entry.billing_period, ['start', 'end'], `${where}.billing_period`);
  const { start, end } = entry.billing_period;
  if (!DATE.test(start) || !DATE.test(end) || end < start) fail(`${where}.billing_period: two dates, start first`);
  if (start > period.end || end < period.start) fail(`${where}.billing_period: does not overlap ${period.id}`);
  return {
    state: 'owner-attested',
    plan: entry.plan,
    basis: 'subscription',
    billing_period: { start, end },
    amount_minor: minorUnits(entry.amount, entry.currency),
    currency: entry.currency,
    evidence_ref: evidenceRef,
  };
}

/**
 * The owner's attestation for a period, from a capture of #691: `{ url, entries }`, or null when none exists.
 *
 * Only a comment the owner authored counts — anyone can post a marker. The latest attestation for the period
 * wins, because a correction is a new comment; an EDITED one is refused, because an edit leaves the cited URL
 * pointing at text that is no longer what the snapshot was built from.
 */
export function attestationFor(capture, period) {
  if (!capture || capture.url !== ATTESTATION_ISSUE_URL || !Array.isArray(capture.comments)) {
    fail(`attestation: not a capture of ${ATTESTATION_ISSUE_URL} with --json url,comments`);
  }
  const found = [];
  for (const comment of capture.comments) {
    const body = String(comment.body ?? '');
    if (!ATTESTATION_MARKER.test(body)) continue;
    if (comment.author?.login !== OWNER_LOGIN || comment.authorAssociation !== 'OWNER') continue;
    const blocks = [...body.matchAll(ATTESTATION_RE)];
    if (blocks.length !== 1) fail(`attestation ${comment.url}: must hold exactly one v1 block`);
    let parsed;
    try {
      parsed = JSON.parse(blocks[0][1]);
    } catch {
      fail(`attestation ${comment.url}: invalid JSON`);
    }
    if (parsed.period !== period.id) continue;
    if (comment.includesCreatedEdit !== false) fail(`attestation ${comment.url}: edited; post a new comment instead`);
    if (!COMMENT_URL.test(comment.url ?? '')) fail(`attestation ${comment.url}: not a comment on #691`);
    found.push({ url: comment.url, createdAt: comment.createdAt, parsed });
  }
  if (found.length === 0) return null;
  found.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = found.at(-1);
  exactKeys(latest.parsed, ['period', 'entries'], `attestation ${latest.url}`);
  if (!Array.isArray(latest.parsed.entries)) fail(`attestation ${latest.url}: entries must be an array`);
  const entries = {};
  latest.parsed.entries.forEach((entry, index) => {
    const where = `attestation ${latest.url} entries[${index}]`;
    if (!PROVIDERS.includes(entry?.provider)) fail(`${where}.provider: one of ${PROVIDERS.join(', ')}`);
    if (entries[entry.provider]) fail(`${where}: ${entry.provider} attested twice`);
    entries[entry.provider] = spendOf(entry, latest.url, period, where);
  });
  return { url: latest.url, entries };
}

const PENDING = { state: 'pending-attestation', plan: null, basis: null, billing_period: null, amount_minor: null, currency: null, evidence_ref: null };

/** Method 1.0.0 allocates nothing to features (#823), so the whole attested amount is shared/unallocated. */
export function allocationOf(spend) {
  const attested = spend.state === 'owner-attested';
  return {
    state: 'not-estimable',
    allocated_minor: null,
    shared_unallocated_minor: attested ? spend.amount_minor : null,
    rounding_minor: attested ? 0 : null,
  };
}

export const commandFor = (periodId) =>
  `npm --prefix apps/fed run gen-economics -- --period ${periodId} --export <worklog-export.json> ` +
  '--attestation <issue-691-capture.json> --refused <Issues the worklog export refused>';

const ISSUE_REF = /^([^/\s]+\/[^/#\s]+)#([1-9]\d*)$/;

/**
 * The Issues whose capture `worklog.py export` refused, as `owner/repo#N`, sorted and de-duplicated.
 *
 * DECLARED, NOT INFERRED, because the export cannot say what was left out of it: a refused capture is simply
 * absent. The worklog refuses a capture whose comments carry an event naming another Issue, which is what an
 * Issue transferred between repositories looks like. Publishing the list keeps the denominator honest — a
 * reader can open each one and check that it holds no event inside the period.
 */
export function refusedIssues(list) {
  const refs = (list ?? []).map((ref) => {
    const match = ISSUE_REF.exec(ref);
    if (!match || !ALLOWED_REPOSITORIES.includes(match[1])) fail(`refused ${ref}: an Issue in an allowlisted public repository`);
    return ref;
  });
  return [...new Set(refs)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/** The whole snapshot, from parsed inputs plus the export's exact text (hashed, so a reader can match it). */
export function buildSnapshot({ periodId, exportData, exportText, attestationCapture, refused = [] }) {
  const period = periodOf(periodId);
  const cutoff = String(exportData?.cutoff ?? '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(cutoff)) fail('export.cutoff: a UTC timestamp');
  const asOf = cutoff.slice(0, 10);
  if (asOf <= period.end) fail(`export.cutoff ${cutoff}: the period has not closed`);
  const repositories = (exportData.repositories ?? []).map((repo) => {
    if (!ALLOWED_REPOSITORIES.includes(repo.repository)) fail(`export: ${repo.repository} is not an allowlisted public repository`);
    return { repository: repo.repository, pagination_complete: repo.pagination_complete === true };
  });
  if (repositories.length === 0) fail('export: declares no repository');
  const runs = periodRuns(extractEvents(exportData), period);
  const attestation = attestationFor(attestationCapture, period);
  const providers = PROVIDERS.map((provider) => {
    const own = runs.filter((run) => run.provider === provider);
    const spend = attestation?.entries[provider] ?? PENDING;
    return { provider, spend, consumption: consumptionOf(provider, own), regime: regimeOf(own), allocation: allocationOf(spend) };
  });
  return {
    schema_version: SCHEMA_VERSION,
    method_version: METHOD_VERSION,
    period: { id: period.id, start: period.start, end: period.end },
    as_of: asOf,
    coverage_source: {
      instrument: 'worklog-export-v1',
      command: commandFor(period.id),
      export_sha256: createHash('sha256').update(exportText).digest('hex'),
      cutoff,
      repositories,
      issues_in_export: new Set(exportData.comments.map((comment) => comment.issue)).size,
      issues_refused: refusedIssues(refused),
      unattributed_runs: runs.filter((run) => run.provider === null).length,
    },
    providers,
  };
}

/** Byte-stable serialisation: the key order above, two-space indent, one trailing newline. */
export const serialize = (snapshot) => `${JSON.stringify(snapshot, null, 2)}\n`;

/** A snapshot with no provider awaiting attestation is final: the producer will not overwrite it. */
export const isFinal = (snapshot) => snapshot.providers.every((card) => card.spend.state !== 'pending-attestation');
