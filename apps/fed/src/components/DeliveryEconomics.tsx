// The delivery-economics section on /architecture (#691, ADR-0055) — the ```delivery-economics fence.
//
// IT RENDERS ONE COMMITTED SNAPSHOT AND DECIDES NOTHING ABOUT IT. What the numbers are, and whether they are
// admissible, is settled before this file runs: by the producer offline and by `economicsSchema.ts` at module
// load. This component only chooses words for states, and it has one rule that every branch below serves:
//
//   UNKNOWN IS A LABELLED STATE, NEVER A ZERO. `null` renders "not measured", "not estimable" or "pending";
//   a provider absent from the worklog still gets its card; and no figure is ever summed across providers or
//   currencies — there is no total row because there is no honest total to put in it.
//
// COVERAGE LEADS. The section opens with how much of the period was observed and the command that measured
// it (standing rule 13: a measured number ships with its command), before any provider's spend, so a reader
// meets the size of the unknown before the size of the bill.
//
// EVERY DISPLAYED STRING IS IN THE CATALOG (`economics.*`, both locales). What is not translated is
// deliberate and is identifiers only: a model or effort id, a plan's product name, an Issue reference and
// the command, each rendered verbatim as code.
//
// LOCALE, NOT VISITOR. Dates and numbers are formatted in the route's locale with a fixed UTC zone, so the
// prerendered HTML is the same for every visitor and no `window.__PRERENDER__` exemption is needed.
import type { ReactNode } from 'react';
import { dateLocale, useLocale, type MessageKey } from '../i18n';
import { latestSnapshot } from '../data/economics';
import {
  CURRENCY_MINOR_DIGITS,
  PROVIDER_METRICS,
  deriveScorecard,
  type Axis,
  type AxisState,
  type Consumption,
  type ProviderCard,
  type Snapshot,
  type Spend,
} from '../data/economicsSchema';

const PROVIDER_KEY: Record<ProviderCard['provider'], MessageKey> = {
  anthropic: 'economics.providerAnthropic',
  openai: 'economics.providerOpenai',
  kiro: 'economics.providerKiro',
};

const METRIC_KEY = {
  tokens_input: 'economics.metricTokensInput',
  tokens_output: 'economics.metricTokensOutput',
  credits: 'economics.metricCredits',
} as const satisfies Record<string, MessageKey>;

const AXIS_KEY: Record<Axis, MessageKey> = {
  throughput: 'economics.axisThroughput',
  laborIntensity: 'economics.axisLaborIntensity',
  aiConsumption: 'economics.axisAiConsumption',
  allocatedCost: 'economics.axisAllocatedCost',
  aiConsumptionIntensity: 'economics.axisAiConsumptionIntensity',
  costIntensity: 'economics.axisCostIntensity',
  flowTime: 'economics.axisFlowTime',
  qualityYield: 'economics.axisQualityYield',
  baselineChange: 'economics.axisBaselineChange',
  deliveryMix: 'economics.axisDeliveryMix',
  regime: 'economics.axisRegime',
  coverage: 'economics.axisCoverage',
  sharedUnallocated: 'economics.axisSharedUnallocated',
  movement: 'economics.axisMovement',
};

const STATE_KEY: Record<AxisState, MessageKey> = {
  measured: 'economics.stateMeasured',
  partial: 'economics.statePartial',
  'not-measured': 'economics.stateNotMeasured',
  pending: 'economics.statePending',
  'not-estimable': 'economics.stateNotEstimable',
  'not-yet-instrumented': 'economics.stateNotYetInstrumented',
};

const fill = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, () => value), template);

function useFormat() {
  const { locale, t } = useLocale();
  const tag = dateLocale(locale);
  const integer = new Intl.NumberFormat(tag);
  return {
    t,
    int: (value: number) => integer.format(value),
    date: (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }),
    month: (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { timeZone: 'UTC', year: 'numeric', month: 'long' }),
    money: (minor: number, currency: keyof typeof CURRENCY_MINOR_DIGITS) =>
      new Intl.NumberFormat(tag, { style: 'currency', currency }).format(minor / 10 ** CURRENCY_MINOR_DIGITS[currency]),
  };
}

type Format = ReturnType<typeof useFormat>;

/** A value cell that is a STATE, not a number — tagged so the tests can tell the two apart. */
function State({ children, state }: { children: string; state: string }) {
  return (
    <span data-economics-state={state} className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-border p-3 last:border-b-0">
      <dt className="font-mono text-xs uppercase tracking-wider">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function SpendValue({ spend, f }: { spend: Spend; f: Format }) {
  if (spend.state === 'pending-attestation') return <State state="pending">{f.t('economics.spendPending')}</State>;
  if (spend.state === 'no-subscription') {
    return (
      <>
        <State state="no-subscription">{f.t('economics.spendNone')}</State>{' '}
        <a href={spend.evidence_ref ?? undefined}>{f.t('economics.spendEvidence')}</a>
      </>
    );
  }
  // An attested spend: the validator guarantees every field below is present.
  const period = spend.billing_period as NonNullable<Spend['billing_period']>;
  return (
    <>
      <span data-economics-amount className="font-mono">
        {f.money(spend.amount_minor as number, spend.currency as keyof typeof CURRENCY_MINOR_DIGITS)}
      </span>{' '}
      <code>{spend.plan}</code>
      <br />
      <span className="text-sm text-muted-foreground">
        {fill(f.t('economics.billingPeriod'), { start: f.date(period.start), end: f.date(period.end) })}
      </span>{' '}
      <a href={spend.evidence_ref ?? undefined}>{f.t('economics.spendEvidence')}</a>
    </>
  );
}

function ConsumptionValue({ card, f }: { card: ProviderCard; f: Format }) {
  const c: Consumption = card.consumption;
  const reported = PROVIDER_METRICS[card.provider].filter((metric) => c.metrics[metric].sum !== null);
  const coverage =
    c.runs === 0
      ? f.t('economics.coverageNoRuns')
      : fill(f.t('economics.coverageRuns'), { native: f.int(c.native_runs), runs: f.int(c.runs), issues: f.int(c.issues) });
  return (
    <>
      {reported.length === 0 ? (
        <State state="not-measured">{f.t('economics.stateNotMeasured')}</State>
      ) : (
        <ul>
          {reported.map((metric) => (
            <li key={metric} className="font-mono">
              {fill(f.t(METRIC_KEY[metric]), {
                value: f.int(c.metrics[metric].sum as number),
                runs: f.int(c.metrics[metric].runs),
              })}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">{coverage}</p>
    </>
  );
}

function RegimeValue({ card, f }: { card: ProviderCard; f: Format }) {
  if (card.regime.length === 0) return <State state="not-measured">{f.t('economics.stateNotMeasured')}</State>;
  return (
    <ul>
      {card.regime.map((entry) => (
        <li key={`${entry.model}|${entry.effort ?? ''}`}>
          <code>{entry.model}</code> · {entry.effort ? <code>{entry.effort}</code> : f.t('economics.effortUndeclared')} ·{' '}
          {fill(f.t('economics.regimeRuns'), { runs: f.int(entry.runs) })}
        </li>
      ))}
    </ul>
  );
}

/** While nothing is allocated to features, the whole attested amount is shared/unallocated (ADR-0055). */
function SharedValue({ card, f }: { card: ProviderCard; f: Format }) {
  const { spend, allocation } = card;
  if (spend.state === 'pending-attestation') return <State state="pending">{f.t('economics.statePending')}</State>;
  if (spend.state === 'no-subscription') return <State state="no-subscription">{f.t('economics.spendNone')}</State>;
  return (
    <span className="font-mono">
      {f.money(allocation.shared_unallocated_minor as number, spend.currency as keyof typeof CURRENCY_MINOR_DIGITS)}
    </span>
  );
}

function ProviderSection({ card, f }: { card: ProviderCard; f: Format }) {
  const { spend, allocation } = card;
  return (
    <section data-economics-provider={card.provider} className="border border-border">
      <h3 className="border-b border-border p-3 font-mono text-sm uppercase tracking-wider">{f.t(PROVIDER_KEY[card.provider])}</h3>
      <dl>
        <Row label={f.t('economics.spendLabel')}>
          <SpendValue spend={spend} f={f} />
        </Row>
        <Row label={f.t('economics.consumptionLabel')}>
          <ConsumptionValue card={card} f={f} />
        </Row>
        <Row label={f.t('economics.regimeLabel')}>
          <RegimeValue card={card} f={f} />
        </Row>
        <Row label={f.t('economics.allocatedLabel')}>
          {allocation.allocated_minor === null || spend.currency === null ? (
            <State state="not-estimable">{f.t('economics.stateNotEstimable')}</State>
          ) : (
            <span className="font-mono">{f.money(allocation.allocated_minor, spend.currency)}</span>
          )}
        </Row>
        <Row label={f.t('economics.sharedLabel')}>
          <SharedValue card={card} f={f} />
        </Row>
        <Row label={f.t('economics.utilizationLabel')}>
          <State state="unavailable">{f.t('economics.utilizationUnavailable')}</State>
        </Row>
      </dl>
    </section>
  );
}

function CoverageSection({ snapshot, f }: { snapshot: Snapshot; f: Format }) {
  const source = snapshot.coverage_source;
  return (
    <section data-economics-coverage className="border border-border">
      <h3 className="border-b border-border p-3 font-mono text-sm uppercase tracking-wider">{f.t('economics.coverageHeading')}</h3>
      <dl>
        {snapshot.providers.map((card) => (
          <Row key={card.provider} label={f.t(PROVIDER_KEY[card.provider])}>
            {card.consumption.runs === 0
              ? f.t('economics.coverageNoRuns')
              : fill(f.t('economics.coverageRuns'), {
                  native: f.int(card.consumption.native_runs),
                  runs: f.int(card.consumption.runs),
                  issues: f.int(card.consumption.issues),
                })}
          </Row>
        ))}
        <Row label={f.t('economics.sourceLabel')}>
          <code className="break-words">{source.command}</code>
          <p className="mt-1 text-sm text-muted-foreground">
            {fill(f.t('economics.sourceScope'), {
              repositories: source.repositories.map((r) => r.repository).join(', '),
              issues: f.int(source.issues_in_export),
              refused: f.int(source.issues_refused.length),
            })}
          </p>
          {source.issues_refused.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {f.t('economics.refusedLabel')} <code className="break-words">{source.issues_refused.join(', ')}</code>
            </p>
          )}
        </Row>
      </dl>
    </section>
  );
}

export function DeliveryEconomics({ snapshot = latestSnapshot() }: { snapshot?: Snapshot }) {
  const f = useFormat();
  return (
    <div data-economics className="my-8 space-y-6">
      <p data-economics-period className="font-mono text-sm">
        {fill(f.t('economics.periodLine'), { period: f.month(snapshot.period.start), asOf: f.date(snapshot.as_of) })}
      </p>
      <CoverageSection snapshot={snapshot} f={f} />
      <div className="grid gap-6 md:grid-cols-3">
        {snapshot.providers.map((card) => (
          <ProviderSection key={card.provider} card={card} f={f} />
        ))}
      </div>
      <section data-economics-scorecard className="border border-border">
        <h3 className="border-b border-border p-3 font-mono text-sm uppercase tracking-wider">{f.t('economics.scorecardHeading')}</h3>
        <dl>
          {deriveScorecard(snapshot).map((entry) => (
            <Row key={entry.axis} label={f.t(AXIS_KEY[entry.axis])}>
              <State state={entry.state}>{f.t(STATE_KEY[entry.state])}</State>
            </Row>
          ))}
        </dl>
      </section>
    </div>
  );
}
