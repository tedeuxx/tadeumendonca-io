// Subject ticker (/frontend/design-system) — the one moving element on the page. CSS only, no
// framer-motion. The list is duplicated so the -50% translation loops seamlessly; the copy is
// aria-hidden so a screen reader reads the subjects once. Under prefers-reduced-motion the global
// reset in index.css freezes the animation, leaving a static (still readable) strip.
//
// It advertises SUBJECTS, not the owner — the marquee is part of the reader-first pitch.
import { useT } from '../i18n';

const SUBJECTS = [
  'Agentic AI',
  'Tool-Calling',
  'RAG',
  'MCP',
  'Evaluation Loops',
  'AI-DLC',
  'Claude Code',
  'Python',
  'TypeScript',
  'AWS Bedrock',
  'Distributed Systems',
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center py-2.5 font-mono text-sm uppercase tracking-[0.1em]">
      {SUBJECTS.map((subject) => (
        <span key={subject} className="flex items-center whitespace-nowrap">
          {subject}
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
    <div aria-label={t('marquee.subjects')} className="relative z-10 overflow-hidden border-y border-b-border border-t-2 border-t-border-strong bg-background">
      <div className="flex w-max animate-marquee">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
