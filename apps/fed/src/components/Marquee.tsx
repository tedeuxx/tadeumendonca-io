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
import { useT } from '../i18n';

// ONE LIST, BOTH EDITIONS — owner decision, 2026-07-31: ordinary technical nouns stay English in pt.
//
// This briefly carried a `Record<Locale, readonly string[]>` translating `Observabilidade`,
// `Segurança` and `Sistemas Distribuídos`. The owner settled the rule the other way, and the RULE is
// what mattered: `profile.ts` already keeps every individual skill name English in both editions and
// translates only GROUP labels, so a translated strip meant a pt reader met `Observabilidade` on the
// landing and `Observability` on /me. One rule was missing across two surfaces; now there is one.
//
// The locale plumbing went with it. A type modelling variance that nothing exercises is machinery
// pretending to be a safeguard, and this repo's floor is the simplest thing that solves it. If the
// rule ever flips, the Record comes back — and `Hero.test.tsx` asserts the rule through the RENDER
// under both locales rather than by reading this constant, so it catches the regression either way.
//
// ORDER BUYS ADJACENCY, NOT A READING SEQUENCE. An earlier version of this comment claimed "a reader
// scanning left to right meets the repositioning before the history" — the strip is an infinite loop
// with no visible start, so the reader meets whatever is on screen when they arrive. What the order
// actually controls is which terms NEIGHBOUR each other: `Java`/`Spring Boot` always sit beside
// `TypeScript` and `AWS` rather than beside `Agentic AI`, and the seam back to the top reads
// `Distributed Systems → Agentic AI`, which is the repositioning's own argument in one join.
//
// `Harness Engineering` sits beside `AI-DLC`, not beside `Context Engineering`. Two coined tokens
// both ending in `Engineering`, adjacent, in uppercase mono at glance speed, read as one hedged
// concept stated twice — and the part-whole relation between them (context engineering is INSIDE the
// harness) is invisible at that granularity. Beside `AI-DLC` it reads as identity, which is how the
// vocabulary hierarchy already binds the two.
const STACK = [
  'Agentic AI',
  'MCP',
  'Context Engineering',
  'AI-DLC',
  'Harness Engineering',
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
] as const;

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center py-2.5 font-mono text-sm uppercase tracking-[0.1em]">
      {STACK.map((item) => (
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
  return (
    <div data-print="hide" aria-label={t('marquee.subjects')} className="relative z-10 overflow-hidden border-y border-b-border border-t-2 border-t-border-strong bg-background">
      <div className="flex w-max animate-marquee">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
