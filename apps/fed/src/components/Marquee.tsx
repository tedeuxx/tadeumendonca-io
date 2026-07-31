// Stack ticker (/frontend/design-system) — the one moving element on the page. CSS only, no
// framer-motion. The list is duplicated so the -50% translation loops seamlessly; the copy is
// aria-hidden so a screen reader reads it once. Under prefers-reduced-motion the global reset in
// index.css freezes the animation, leaving a static (still readable) strip.
//
// IT ADVERTISES THE STACK, NOT SUBJECTS — owner decision, 2026-07-31, and the label changed with it.
// It used to say "Assuntos"/"Subjects" and claim to be what the site is ABOUT. That stopped being
// true the moment Java, Spring Boot and CI/CD went in: the site does not write about them. A strip
// labelled "subjects" listing things no article covers is a capability stated as track record — the
// same defect that took the video promise out of the articles subline the same day. So the label
// follows the content instead of the content being trimmed to fit a stale label: this is what the
// owner works with, and showing 18 years of SDLC under the AI-native layer is the point rather than
// the cost.
import { useLocale, useT, type Locale } from '../i18n';

// Typed per locale so a missing translation is a COMPILE error, the rule every reader-facing module
// in this repo follows (#235). Most entries are identical across editions because they are proper
// nouns — `Python`, `MCP`, `Terraform` — and because `agentic`, `AI-native` and the harness/context
// vocabulary stay English in both locales by positioning rule. The two that genuinely localise are
// the ordinary technical nouns a pt-BR reader would expect in Portuguese.
//
// ORDER IS DELIBERATE: the AI-native layer first, the languages next, the platform and the
// engineering floor last. A reader scanning left to right meets the repositioning before the
// history, which is the whole argument the strip is making.
const STACK: Record<Locale, readonly string[]> = {
  en: [
    'Agentic AI',
    'MCP',
    'Context Engineering',
    'Harness Engineering',
    'AI-DLC',
    'Claude Code',
    'Python',
    'Node.js',
    'TypeScript',
    'Java',
    'Spring Boot',
    'AWS',
    'Terraform',
    'CI/CD',
    'Observability',
    'Security',
    'Distributed Systems',
  ],
  pt: [
    'Agentic AI',
    'MCP',
    'Context Engineering',
    'Harness Engineering',
    'AI-DLC',
    'Claude Code',
    'Python',
    'Node.js',
    'TypeScript',
    'Java',
    'Spring Boot',
    'AWS',
    'Terraform',
    'CI/CD',
    'Observabilidade',
    'Segurança',
    'Sistemas Distribuídos',
  ],
};

function Track({ items, hidden = false }: { items: readonly string[]; hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center py-2.5 font-mono text-sm uppercase tracking-[0.1em]">
      {items.map((item) => (
        <span key={item} className="flex items-center whitespace-nowrap">
          {item}
          <span aria-hidden="true" className="px-[1.1rem] text-primary">
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

export function Marquee() {
  const t = useT();
  const { locale } = useLocale();
  const items = STACK[locale];
  return (
    <div data-print="hide" aria-label={t('marquee.subjects')} className="relative z-10 overflow-hidden border-y border-b-border border-t-2 border-t-border-strong bg-background">
      <div className="flex w-max animate-marquee">
        <Track items={items} />
        <Track items={items} hidden />
      </div>
    </div>
  );
}
