// Landing (/) — the content shop window, reader-first: articles are the main pane, the portfolio is
// a full-width section, contact closes the page. The owner's name and bio do NOT live here; they
// live on /cv. Fully static (../data/*, markdown-in-repo) — no backend call.
//
// Slice 3 wires the anchored regions and owns the document head + Person JSON-LD (moved off the
// retired HomePage). Hero, the slim aside, the reader-first article cards and the contact footer
// land in their own slices.
import { useProfile } from '../hooks/useProfile';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { ArticlesSection } from '../components/ArticlesSection';
import { PortfolioSection } from '../components/PortfolioSection';
import { SocialLinksWidget } from '../components/SocialLinksWidget';
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
      <ArticlesSection />

      <section id="portfolio" className="scroll-mt-[--header-h] border-t-2 border-border-strong">
        <PortfolioSection />
      </section>

      <section id="contato" className="scroll-mt-[--header-h] border-t-2 border-border-strong px-4 py-5">
        <SocialLinksWidget />
      </section>
    </div>
  );
}
