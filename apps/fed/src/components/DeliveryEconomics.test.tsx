// The delivery-economics section (#691, ADR-0055): unknown is a labelled state, never a zero.
//
// TWO KINDS OF INPUT. The committed snapshot, because it is what ships; and variants of it built through the
// validator, because the first period is almost entirely unknown and the attested, measured and no-subscription
// branches would otherwise never render under test. A variant that the validator refuses cannot reach here.
import { describe, it, expect } from 'vitest';
import { DeliveryEconomics } from './DeliveryEconomics';
import { renderWithLocale } from '../test-utils';
import { strings } from '../i18n';
import { latestSnapshot } from '../data/economics';
import { AXES, validateSnapshot, type Snapshot } from '../data/economicsSchema';
import architectureEn from '../content/architecture.en.md?raw';
import architecturePt from '../content/architecture.pt.md?raw';

const EVIDENCE = 'https://github.com/tedeuxx/tadeumendonca-io/issues/691#issuecomment-77';

const variant = (mutate: (s: Snapshot) => void): Snapshot => {
  const s = structuredClone(latestSnapshot());
  mutate(s);
  return validateSnapshot(s);
};

const attested = () =>
  variant((s) => {
    s.providers[0].spend = {
      state: 'owner-attested',
      plan: 'Claude Max',
      basis: 'subscription',
      billing_period: { start: '2026-10-05', end: '2026-11-04' },
      amount_minor: 12345,
      currency: 'USD',
      evidence_ref: EVIDENCE,
    };
    s.providers[0].allocation = { state: 'not-estimable', allocated_minor: null, shared_unallocated_minor: 12345, rounding_minor: 0 };
    s.providers[2].spend = { ...s.providers[2].spend, state: 'no-subscription', evidence_ref: EVIDENCE };
    s.providers[0].regime = [
      { model: 'claude-opus-5-5', effort: 'high', runs: 1 },
      { model: 'claude-opus-5-5', effort: null, runs: 1 },
    ];
    s.providers[0].consumption = {
      ...s.providers[0].consumption,
      coverage: 'partial',
      native_runs: 1,
      unrecorded_runs: 3,
      metrics: { ...s.providers[0].consumption.metrics, tokens_input: { sum: 1234567, runs: 1 } },
    };
  });

const render = (locale: 'pt' | 'en', snapshot?: Snapshot) =>
  renderWithLocale(<DeliveryEconomics snapshot={snapshot} />, { locale }).container;

const provider = (root: HTMLElement, name: string) => root.querySelector(`[data-economics-provider="${name}"]`) as HTMLElement;

describe('the committed first period', () => {
  it.each(['pt', 'en'] as const)('shows the period and as_of first (%s)', (locale) => {
    const root = render(locale);
    const line = root.querySelector('[data-economics-period]')!;
    expect(line.textContent).toContain(locale === 'pt' ? 'outubro de 2026' : 'October 2026');
    expect(line.textContent).toContain(locale === 'pt' ? '21 de nov. de 2026' : 'Nov 21, 2026');
    // Coverage leads: it comes before the first provider card in document order.
    const coverage = root.querySelector('[data-economics-coverage]')!;
    const first = provider(root, 'anthropic');
    expect(coverage.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders every provider, Kiro included, and none of their unknowns as a number', () => {
    const root = render('en');
    for (const name of ['anthropic', 'openai', 'kiro']) {
      const card = provider(root, name);
      expect(card, name).not.toBeNull();
      // Every value cell on a pending, unmeasured card is a STATE. Not one digit is rendered as a figure.
      expect(card.querySelector('[data-economics-amount]'), name).toBeNull();
      expect(card.querySelectorAll('[data-economics-state="pending"]').length, name).toBe(2);
      expect(card.querySelectorAll('[data-economics-state="not-measured"]').length, name).toBe(2);
      expect(card.querySelector('[data-economics-state="not-estimable"]'), name).not.toBeNull();
      expect(card.querySelector('[data-economics-state="unavailable"]'), name).not.toBeNull();
      // The one zero a card may show is a COUNT — "0 of 4 recorded runs reported native usage" — which is a
      // measurement, not an unknown. Everything else on the card must be free of a bare zero.
      const withoutCounts = card.textContent!.replace(/Native usage reported: \d+ of \d+ recorded runs/, '');
      expect(withoutCounts, name).not.toMatch(/\b0\b/);
    }
    expect(provider(root, 'kiro').textContent).toContain('Not measured');
  });

  it('shows the measured coverage beside the command that measured it', () => {
    const root = render('en');
    const coverage = root.querySelector('[data-economics-coverage]')!;
    const s = latestSnapshot();
    expect(coverage.textContent).toContain(
      `Native usage reported: 0 of ${s.providers[0].consumption.runs} recorded runs · Issues: ${s.providers[0].consumption.issues}`,
    );
    expect(coverage.textContent).toContain('No worklog run recorded in this period');
    expect(coverage.querySelector('code')!.textContent).toBe(s.coverage_source.command);
    expect(coverage.textContent).toContain(s.coverage_source.issues_refused[0]);
  });

  it('lists all fourteen axes, each in its state, never a value', () => {
    const root = render('en');
    const rows = root.querySelectorAll('[data-economics-scorecard] dt');
    expect(rows).toHaveLength(AXES.length);
    const states = [...root.querySelectorAll('[data-economics-scorecard] [data-economics-state]')].map((el) =>
      el.getAttribute('data-economics-state'),
    );
    expect(states).toHaveLength(AXES.length);
    expect(states.filter((s) => s === 'not-yet-instrumented')).toHaveLength(7);
    expect(root.querySelector('[data-economics-scorecard]')!.textContent).toContain('Not yet instrumented');
  });

  it('renders the same facts in both locales with different words', () => {
    const facts = (root: HTMLElement) =>
      [...root.querySelectorAll('[data-economics-state]')].map((el) => el.getAttribute('data-economics-state'));
    const pt = render('pt');
    const ptFacts = facts(pt);
    const ptText = pt.textContent;
    const en = render('en');
    expect(facts(en)).toEqual(ptFacts);
    expect(en.textContent).not.toBe(ptText);
  });
});

describe('the branches the first period does not reach', () => {
  it('formats an attested amount in the route’s locale, with plan, billing period and evidence', () => {
    const en = provider(render('en', attested()), 'anthropic');
    expect(en.querySelector('[data-economics-amount]')!.textContent).toBe('$123.45');
    expect(en.textContent).toContain('Claude Max');
    expect(en.textContent).toContain('Billing period: Oct 5, 2026 to Nov 4, 2026');
    expect(en.querySelector(`a[href="${EVIDENCE}"]`)!.textContent).toBe('Attestation');
    // While nothing is allocated, the whole amount is shared/unallocated — the reconciliation, rendered.
    expect(en.textContent).toContain('Shared / unallocated$123.45');
    expect(en.querySelector('[data-economics-state="not-estimable"]')).not.toBeNull();

    const pt = provider(render('pt', attested()), 'anthropic');
    expect(pt.querySelector('[data-economics-amount]')!.textContent!.replace(/\s/g, ' ')).toBe('US$ 123,45');
  });

  it('a provider with no subscription says so, with its evidence, and still shows no zero', () => {
    const kiro = provider(render('en', attested()), 'kiro');
    expect(kiro.querySelectorAll('[data-economics-state="no-subscription"]')).toHaveLength(2);
    expect(kiro.querySelector(`a[href="${EVIDENCE}"]`)).not.toBeNull();
    expect(kiro.textContent).not.toMatch(/\b0\b/);
  });

  it('renders reported metrics, partial coverage and the regime verbatim', () => {
    const card = provider(render('en', attested()), 'anthropic');
    expect(card.textContent).toContain('input tokens: 1,234,567 (runs: 1)');
    // Output tokens were not reported, so they are absent rather than shown as zero.
    expect(card.textContent).not.toContain('output tokens');
    expect(card.textContent).toContain('Native usage reported: 1 of 4 recorded runs');
    const codes = [...card.querySelectorAll('li code')].map((c) => c.textContent);
    expect(codes).toEqual(['claude-opus-5-5', 'high', 'claude-opus-5-5']);
    expect(card.textContent).toContain('effort not declared');
  });

  it('renders an allocated amount once an allocation is estimable', () => {
    const s = variant((x) => {
      Object.assign(x, attested());
      x.providers[0].allocation = { state: 'estimable', allocated_minor: 10000, shared_unallocated_minor: 2345, rounding_minor: 0 };
    });
    const card = provider(render('en', s), 'anthropic');
    expect(card.textContent).toContain('Allocated subscription cost$100.00');
    expect(card.textContent).toContain('Shared / unallocated$23.45');
  });

  it('says nothing about refusals when the export refused none', () => {
    const root = render('en', variant((s) => (s.coverage_source.issues_refused = [])));
    expect(root.textContent).not.toContain('Refused, because');
  });
});

// THE REJECTED READINGS STAY OUT OF BOTH EDITIONS (ADR-0055, options 6 and 7). Checked over every word the
// section can show — the catalog group — and over the section's own prose in each markdown edition.
describe('the vocabulary the method refuses', () => {
  const FORBIDDEN = [
    /cost per token/i,
    /custo por token/i,
    /\bROI\b/,
    /productivity/i,
    /produtividade/i,
    /efficiency/i,
    /efici[eê]ncia/i,
    /model winner/i,
    /melhor modelo/i,
    /(?<!allocated )(?<!subscription )feature cost/i,
  ];
  const catalog = Object.values(strings.economics).flatMap((entry) => [entry.pt, entry.en]);
  const section = (md: string, heading: string) => md.slice(md.indexOf(heading), md.indexOf('\n## ', md.indexOf(heading) + 1));
  const prose = [
    section(architectureEn, '## What the harness costs to run'),
    section(architecturePt, '## Quanto custa rodar o harness'),
  ];

  it('finds the section in each edition, so the scan below is not vacuous', () => {
    for (const text of prose) expect(text).toContain('```delivery-economics');
    expect(catalog.length).toBeGreaterThan(40);
  });

  it.each(FORBIDDEN.map((pattern) => [String(pattern), pattern] as const))('%s appears nowhere', (_name, pattern) => {
    for (const text of [...catalog, ...prose]) expect(text).not.toMatch(pattern);
  });
});
