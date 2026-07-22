// Hero (/frontend/design-system) — the signature surface. The title is the BRAND, not the person:
// the owner's name and bio live on /cv. Copy is reader-first (what you walk away knowing), and it
// speaks to both audiences: personal-life automation and engineering in production.
//
// The title is a single unbreakable line (whitespace-nowrap) that scales with the viewport, so the
// brand never wraps mid-word — hence the reduced clamp ceiling compared to the hero font size.
import { Marquee } from './Marquee';
import { GridLines } from './GridLines';

export function Hero() {
  return (
    <header id="top" className="relative">
      <GridLines />
      <div className="relative z-10 px-[--gutter] pt-[clamp(2.5rem,7vw,6rem)]">
        <div className="mb-[clamp(1.4rem,4vw,2.6rem)] flex flex-wrap gap-x-6 gap-y-2">
          <span className="label-mono">Conteúdo técnico aberto</span>
          <span className="label-mono text-primary">▶ Da vida pessoal à produção</span>
        </div>

        <h1 className="whitespace-nowrap text-[clamp(1.9rem,8vw,7rem)] font-bold lowercase leading-[0.9] tracking-[-0.05em]">
          tadeumendonca<span className="text-primary">.io</span>
        </h1>

        <p className="mt-[clamp(1.2rem,3vw,2.2rem)] max-w-[20ch] text-balance text-[clamp(1.35rem,4.2vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          Aprenda a construir com IA — <span className="text-primary">do dia a dia à produção</span>.
        </p>

        <p className="my-[clamp(1.4rem,3vw,2rem)] mb-[clamp(1.8rem,4vw,2.6rem)] max-w-[60ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-[1.45] text-muted-foreground">
          Compartilho o que aprendo construindo com IA — de experimentos que automatizam a{' '}
          <b className="font-medium text-foreground">vida pessoal com Claude Cowork</b> a{' '}
          <b className="font-medium text-foreground">sistemas agentic em produção</b>. Trade-offs reais e código aberto pra você
          aplicar, seja na sua rotina ou na sua empresa. O objetivo é te fazer construir melhor — quem escreve isso é
          consequência, não o ponto.
        </p>

        <div className="mb-[clamp(2.2rem,5vw,3.5rem)] flex flex-wrap">
          <HeroLink href="#artigos">Artigos</HeroLink>
          <HeroLink href="#portfolio">Portfólio</HeroLink>
        </div>
      </div>

      <Marquee />
    </header>
  );
}

function HeroLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="group -mb-px -mr-px inline-flex items-center gap-2 border border-border-strong px-5 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground"
    >
      <span className="text-primary group-hover:text-primary-foreground">→</span>
      {children}
    </a>
  );
}
