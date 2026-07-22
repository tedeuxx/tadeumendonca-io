// Landing (/) — the content shop window, reader-first: articles are the main pane, the portfolio is
// a full-width section, contact closes the page. The owner's name and bio do NOT live here; they
// live on /cv. Fully static (../data/*, markdown-in-repo) — no backend call.
//
// It owns the document head + the Person JSON-LD (the structured data still describes the person,
// even though the visible landing does not). The contact region is a placeholder until the contact
// footer slice replaces it.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Hero } from '../components/Hero';
import { ArticlesSection } from '../components/ArticlesSection';
import { AboutCard } from '../components/AboutCard';
import { ContactLinks } from '../components/ContactLinks';
import { PortfolioSection } from '../components/PortfolioSection';
import { SITE_URL, DEFAULT_DESCRIPTION } from '../lib/site';

export function LandingPage() {
  const { data: profile } = useProfile();

  useDocumentHead({
    title: 'tadeumendonca.io',
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/',
    jsonLd: profile
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          jobTitle: profile.headline,
          url: SITE_URL,
          sameAs: Object.values(profile.metadata),
          ...(profile.location ? { address: profile.location } : {}),
        }
      : undefined,
  });

  return (
    <div>
      <Hero />

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
        <PortfolioSection />
      </section>

      <section id="contato" className="scroll-mt-[--header-h] border-t-2 border-border-strong px-[--gutter] py-8">
        <ContactLinks title="Contato" />
      </section>
    </div>
  );
}
