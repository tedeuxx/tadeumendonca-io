// The /architecture band on the landing (#450) — a teaser for the destination, not a piece of writing.
//
// WHY THIS IS A COMPONENT AND NOT A ROW IN ArticlesSection. That section's control renders
// `articles.read` — published as "Ler artigo" / "Read article" — so a row pointing at /architecture
// would be a control whose label states something the click does not do, on the site's highest-traffic
// block. The rest of the row is article chrome too (<time>, #tag, TrackChip, excerpt, takeaway) and the
// track filter chips make a non-article row unreachable-or-wrong under every chip.
//
// AND NOT A FIFTH HeroLink. The Hero's row already closes on /architecture (#420, with a recorded
// lighter→heavier ordering rationale), #315 recorded the rule against two controls to one destination on
// one screen, and `e2e/hero-row.spec.ts` pins `controls.length === 4` across eight viewport cases. Both
// leads declined it from opposite directions; this band is what they agreed on instead.
//
// AND IT IS PERMANENT, NOT LAUNCH-SCOPED. Decided, because the question was left open rather than
// answered: the copy carries no time-bound word (asserted per locale in the sibling test) but the
// POSITION was argued from the launch, which is a condition that expires. The band's standing reason is
// what /architecture permanently is — the destination carrying the strongest checkable claim on this
// site — and that does not stop being true on the day the launch is over. So there is no retirement
// criterion here and none is owed; a block whose justification expires is the thing that ages on a front
// door, and this one's does not.
//
// THE COST IT WAS ACCEPTED WITH, stated so nobody "fixes" it later: LandingPage's own header comment
// declares the spine — articles are the main pane — and a band above the grid pushes the articles down.
// That is the trade, taken deliberately, and it is taken permanently rather than for a window. Shrinking
// the band into invisibility would keep the spine and lose the reason the band exists.
//
// THE COPY IS THE CATALOG'S, ALL OF IT. `architecture.bandKicker` and `architecture.bandHeading` are the
// two leaves authored for this band; the control renders `nav.architecture` — the SAME key the nav entry
// and the hero control render, which is what keeps the reader meeting one word for one destination. No
// string is composed here, so nothing on this surface can drift from what the catalog publishes.
import { Link as RouterLink } from 'react-router-dom';
import { useLocalePath, useT } from '../i18n';

export function ArchitectureBand() {
  const t = useT();
  const lp = useLocalePath();

  return (
    <section
      aria-labelledby="architecture-band-heading"
      data-testid="architecture-band"
      className="border-t-2 border-border-strong px-[--gutter] py-[clamp(1.8rem,4vw,3rem)]"
    >
      {/* The mono-uppercase register `hero.badge` and `architecture.kicker` already use — the site's
          established way of saying "this is a label, not prose". `label-mono` is the shared component
          class for it (styles/index.css), so the band inherits any future change to that register. */}
      <p className="label-mono">{t('architecture.bandKicker')}</p>

      <h2
        id="architecture-band-heading"
        className="mt-3 max-w-[26ch] text-balance text-[clamp(1.5rem,4vw,2.6rem)] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        {t('architecture.bandHeading')}
      </h2>

      {/* ONE outlined control, in the shared `invert-hover` idiom the ContactFooter chips and the article
          controls use — not a copy of Hero's private HeroLink, whose accent-fill hover belongs to that
          row's four-control rhythm. `flex-wrap` on the container is what keeps a single long label from
          widening the page at 320px; `e2e/architecture-band.spec.ts` measures it rather than assuming it. */}
      <div className="mt-[clamp(1.2rem,3vw,1.8rem)] flex flex-wrap">
        <RouterLink
          to={lp('/architecture')}
          className="-mb-px -mr-px inline-flex items-center border border-border-strong px-5 py-3 font-mono text-sm uppercase tracking-wider invert-hover"
        >
          {t('nav.architecture')}
        </RouterLink>
      </div>
    </section>
  );
}
