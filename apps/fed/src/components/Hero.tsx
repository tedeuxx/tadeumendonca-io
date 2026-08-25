// Hero (/frontend/design-system) — the signature surface. The title is the BRAND, not the person:
// the owner's name and bio live on /me. Copy is reader-first (what you walk away knowing), and it
// speaks to both audiences: personal-life automation and engineering in production.
//
// The title is a single unbreakable line (whitespace-nowrap) that scales with the viewport, so the
// brand never wraps mid-word — hence the reduced clamp ceiling compared to the hero font size.
import { Link as RouterLink } from 'react-router-dom';
import { Marquee } from './Marquee';
import { GridLines } from './GridLines';
import { useLocalePath, useT } from '../i18n';

export function Hero() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <header id="top" className="relative">
      <GridLines />
      <div className="relative z-10 px-[--gutter] pt-[clamp(2.5rem,7vw,6rem)]">
        <div className="mb-[clamp(1.4rem,4vw,2.6rem)] flex flex-wrap gap-x-6 gap-y-2">
          <span className="label-mono">{t('hero.badge')}</span>
          <span className="label-mono text-primary">{t('hero.badgeAccent')}</span>
        </div>

        <h1 className="whitespace-nowrap text-[clamp(1.9rem,8vw,7rem)] font-bold lowercase leading-[0.9] tracking-[-0.05em]">
          tadeumendonca<span className="text-primary">.io</span>
        </h1>

        <p className="mt-[clamp(1.2rem,3vw,2.2rem)] max-w-[20ch] text-balance text-[clamp(1.35rem,4.2vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          {t('hero.taglineLead')} <span className="text-primary">{t('hero.taglineAccent')}</span>.
        </p>

        <p className="my-[clamp(1.4rem,3vw,2rem)] mb-[clamp(1.8rem,4vw,2.6rem)] max-w-[60ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-[1.45] text-muted-foreground">
          {t('hero.bodyLead')} <b className="font-medium text-foreground">{t('hero.bodyStrong1')}</b> {t('hero.bodyConnector')}{' '}
          <b className="font-medium text-foreground">{t('hero.bodyStrong2')}</b>
          {t('hero.bodyTail')}
        </p>

        <div className="mb-[clamp(2.2rem,5vw,3.5rem)] flex flex-wrap">
          {/* THE ORDER OF THIS ROW IS: routes first, the on-page anchor last (#429). It is a rule about
              what a control COSTS the reader, and it explains all four positions rather than only the
              first: `/architecture`, `/ramp-up` and `/portfolio` are real routes a reader can only reach
              by pressing something, while `#artigos` targets `ArticlesSection` — literally the next
              block after <Hero /> in LandingPage.tsx, one screen of scrolling away, no click required.
              The least-necessary control gets the least-valuable slot. Checkable against the mechanism,
              and it does not expire.

              WHICH ROUTE LEADS IS THE OWNER'S CALL, recorded as one rather than dressed up as a
              derivation: architecture first, owner, 2026-08-10. The rule above orders routes against the
              anchor; it does not rank the three routes among themselves, and inventing a derivation for
              a judgement call is how a comment starts arguing for a position nobody chose.

              ~~ARCHITECTURE CLOSES THE ROW (#420), and the position is the whole of the decision. The row
              runs lighter to heavier: a reading path, then the articles anchor, then the shortlist —
              `/architecture` is the deepest read on the site, so it goes last rather than interrupting
              that gradient.~~ STRUCK #429, and struck rather than deleted because it is a stated rule
              being reversed eight days after it was recorded, in the file that records it. The gradient
              argument treated `/architecture` as TERMINAL — the page a reader arrives at once convinced,
              so putting it early would interrupt the climb. That premise moved: it is the destination
              this presence currently argues for, which makes it the exhibit rather than the reward.
              "Deepest read" and "goes last" were only ever linked while the page was the reward.

              Every control still renders its existing `nav.*` catalog key, which is what keeps this a
              chrome change and not a copy one — no string in i18n/messages.ts moves.

              Ramp-up shares the outlined HeroLink styling with the content anchor — it is a real route
              (not a landing anchor), so it renders as a router Link for client-side nav, as do the two
              routes beside it.

              PORTFOLIO IS A ROUTE HERE FOR THE SAME REASON IT IS ONE IN THE NAV (#315). It renders
              `nav.portfolio` — the identical catalog key the nav entry uses — so the two controls show
              the reader the same word. The nav is sticky and this row is the first block, which puts
              both on screen at once on the landing: pointing them at different places would mean one
              word with two behaviours, one screen. Moving the nav entry alone is what would have
              created that, so this line moves with it.

              The alternative was to keep this on `#portfolio` and give it its own label naming what it
              does — a jump to the shortlist below. That needs a NEW string in both editions, which is
              copy, so it is not a call to make inside a routing fix. If the Hero should keep the reader
              on the landing, that is the change to make, deliberately.

              `#portfolio` stays a live anchor with a shareable URL; it simply has no chrome control
              pointing at it now, which is what a section you meet by scrolling should be.

              FOUR IS STILL A ROW, and it is the wrapping container that makes that true rather than an
              opinion — `flex-wrap` on the parent, so the fourth control wraps to a second line at narrow
              widths instead of overflowing. REORDERING IS NOT LAYOUT-NEUTRAL: `flex-wrap` packs greedily,
              so moving the longest label ("Arquitetura"/"Architecture", 11/12 chars) from last to first
              is the single change that most affects how the line breaks. Containment is invariant —
              item widths do not change under reordering, and a wrapped line never exceeds the container
              unless one item does — but the LINE COUNT is not, and nothing asserts it. Re-measured at
              320 and 390 against the built output, both editions, by the committed instrument in
              `e2e/hero-row.spec.ts` (which reports rows and margin on every run since #429, so the next
              reorder does not have to re-author it the way this one did). */}
          <HeroLink to={lp('/architecture')}>{t('nav.architecture')}</HeroLink>
          <HeroLink to={lp('/ramp-up')}>{t('nav.rampup')}</HeroLink>
          <HeroLink to={lp('/portfolio')}>{t('nav.portfolio')}</HeroLink>
          <HeroLink href="#artigos">{t('nav.articles')}</HeroLink>
        </div>
      </div>

      <Marquee />
    </header>
  );
}

// The ramp-up (router) link and the content anchors share one outlined treatment: bordered, filling
// with the accent only on hover — so the accent stays sparing. `to` renders a router Link (real route),
// `href` a plain anchor (landing section).
function HeroLink({ href, to, children }: { href?: string; to?: string; children: string }) {
  const className =
    'group -mb-px -mr-px inline-flex items-center gap-2 border border-border-strong px-5 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground';
  const inner = (
    <>
      <span className="text-primary group-hover:text-primary-foreground">→</span>
      {children}
    </>
  );
  return to ? (
    <RouterLink to={to} className={className}>
      {inner}
    </RouterLink>
  ) : (
    <a href={href} className={className}>
      {inner}
    </a>
  );
}
