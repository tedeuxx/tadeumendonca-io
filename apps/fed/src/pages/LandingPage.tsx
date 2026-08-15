// Landing (/) — the content shop window, reader-first: articles are the main pane, the portfolio is
// a full-width section, contact closes the page. The owner's name and bio do NOT live here; they
// live on /me. Fully static (../data/*, markdown-in-repo) — no backend call.
//
// It owns the document head + the Person JSON-LD (the structured data still describes the person,
// even though the visible landing does not).
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Hero } from '../components/Hero';
import { ArchitectureBand } from '../components/ArchitectureBand';
import { ArticlesSection } from '../components/ArticlesSection';
import { AboutCard } from '../components/AboutCard';
import { ContactLinks } from '../components/ContactLinks';
import { ContactFooter } from '../components/ContactFooter';
import { PortfolioSection } from '../components/PortfolioSection';
import { absoluteUrl, defaultDescription } from '../lib/site';
import { useLocale, useLocalePath } from '../i18n';

export function LandingPage() {
  const { data: profile } = useProfile();
  const { locale } = useLocale();
  const lp = useLocalePath();

  useDocumentHead({
    // DELIBERATE EXCEPTION to ADR-0045. The rule is "lead with the section's nav label", and `/` is not a
    // section — it is the site, and it has no nav entry to lead with. The site name is the whole title
    // here, which is also why `useDocumentHead` emits it bare: it appends SITE_NAME only when the title
    // does not already contain it, so this route reads `tadeumendonca.io`, not `tadeumendonca.io ·
    // tadeumendonca.io`.
    title: 'tadeumendonca.io',
    description: defaultDescription(locale),
    canonicalPath: '/',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          jobTitle: profile.headline,
          url: absoluteUrl(lp('/')),
          sameAs: Object.values(profile.metadata),
          ...(profile.location ? { address: profile.location } : {}),
        }
      : undefined,
  });

  return (
    <div>
      <Hero />

      {/* THE /architecture BAND (#450) SITS ABOVE THE GRID, AND IT PUSHES THE ARTICLES DOWN. That is the
          accepted trade, not an oversight of the spine declared at the top of this file: the launch points
          three surfaces at /architecture, and the front door had no block naming that destination — only a
          nav-weight control at the end of the hero row. Placed here rather than below the grid because a
          teaser a reader reaches after the whole article list is a teaser for people who already stayed.
          The band is deliberately NOT shrunk to protect the spine: a band small enough not to move the
          articles is a band nobody reads, which spends the cost and buys nothing. */}
      <ArchitectureBand />

      {/* Two-column region: articles are the main pane, the aside stays slim and secondary. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <ArticlesSection />
        <aside className="flex flex-col gap-8 border-border px-[--gutter] py-8 max-lg:border-t-2 max-lg:border-border-strong lg:border-l lg:pl-8">
          <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <AboutCard />
            <ContactLinks />
          </div>
        </aside>
      </div>

      <section id="portfolio" className="scroll-mt-[--header-h] border-t-2 border-border-strong">
        <PortfolioSection limit={4} showAllLink />
      </section>

      <ContactFooter />
    </div>
  );
}
