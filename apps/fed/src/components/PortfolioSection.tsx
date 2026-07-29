// Portfolio section (/frontend/design-system) — the curated catalog as GitHub-linked cards, laid out
// full-width on the 12-column grid: a sticky label column beside the card body. Pure/presentational
// (data comes from ../data/catalog), so it is trivially testable and has no backend dependency.
// Used both on the landing (/) and on the dedicated /portfolio page.
//
// The card is reader-first: besides what the project IS, it states what you take away from studying
// it ("o que você tira disso" — the optional `proof` field).
import { Link as RouterLink } from 'react-router-dom';
import { catalog, type CatalogProject } from '../data/catalog';
import { useLocale, useLocalePath, useT } from '../i18n';

function StatusBadge({ status }: { status: CatalogProject['status'] }) {
  const t = useT();
  if (!status) return null;
  return (
    <span className="shrink-0 border border-current px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em]">
      {status === 'live' ? t('portfolio.statusLive') : t('portfolio.statusWip')}
    </span>
  );
}

// The card is an article, not one big anchor: a project can carry both a repo and a live URL, and
// nesting anchors is invalid. The whole surface still reacts as one via the group hover.
function ProjectCard({ project }: { project: CatalogProject }) {
  const t = useT();
  // The prose fields are per-locale (#235); the facts (name, stack, urls) are not.
  const { locale } = useLocale();
  return (
    <article className="group flex flex-col gap-3 border border-border p-6 transition-colors duration-150 hover:bg-foreground hover:text-background">
      {/* `min-w-0` + `anywhere` (#160): a repo name is one unbreakable token (`tadeumendonca.io`), so the
          card's MIN-CONTENT was 306px inside a 284px column — and a grid item never shrinks below its
          min-content, so the card pushed 4px past the viewport at 320px. `overflow-wrap: anywhere` is
          deliberate over Tailwind's `break-words` (`break-word`): only `anywhere` shrinks min-content,
          which is the sizing input that caused this. */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-[1.4rem] font-bold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]">
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="hover:text-primary group-hover:hover:text-primary">
            {project.name}
          </a>
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="font-medium leading-snug">{project.tagline[locale]}</p>
      <p className="text-[15px] leading-relaxed opacity-70">{project.description[locale]}</p>

      {project.proof && (
        <p className="text-[15px] leading-relaxed">
          <span className="mb-0.5 block font-mono text-[0.64rem] uppercase tracking-[0.1em] text-primary">
            {t('portfolio.payoff')}
          </span>
          {project.proof[locale]}
        </p>
      )}

      {project.stack.length > 0 && (
        <div className="flex flex-wrap">
          {project.stack.map((tech) => (
            <span key={tech} className="-mb-px -mr-px border border-border px-2 py-0.5 font-mono text-[0.68rem]">
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-x-5 pt-1 font-mono text-xs uppercase tracking-wider">
        <a href={project.repoUrl} target="_blank" rel="noreferrer" className="hover:underline">
          <span className="text-primary">→</span> {t('portfolio.viewGithub')}
        </a>
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="hover:underline">
            <span className="text-primary">↗</span> {t('portfolio.viewLive')}
          </a>
        )}
      </div>
    </article>
  );
}

/**
 * `limit` truncates the grid (the landing shows a shortlist and links to the full catalog);
 * `showAllLink` renders that link. The /portfolio page passes neither and shows everything.
 * `showBar` publishes the curation standard — the dedicated page opts in, the landing does not (#246).
 */
export function PortfolioSection({
  limit,
  showAllLink = false,
  showBar = false,
}: {
  limit?: number;
  showAllLink?: boolean;
  showBar?: boolean;
}) {
  const t = useT();
  const lp = useLocalePath();
  const shown = limit ? catalog.slice(0, limit) : catalog;

  return (
    <div className="md:grid md:grid-cols-12">
      <div className="px-[--gutter] pb-4 pt-[clamp(2rem,4vw,3.5rem)] md:col-span-3 md:pr-6">
        <div className="md:sticky md:top-[calc(var(--header-h)+2rem)]">
          <span aria-hidden="true" className="block font-mono text-[clamp(2rem,4vw,3.4rem)] font-bold leading-none text-primary">
            ↗
          </span>
          <h2 className="mt-2 label-mono text-foreground">{t('portfolio.heading')}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('portfolio.intro')}</p>
          {/* The bar (#246), on the dedicated page only — the owner chose this in session and PR #251
              carries the ratification; until that comment exists, read this as the proposed shape. The
              distinction is not pedantry: ADR-0003's amendment makes a relayed answer a notification, not
              the authority, and a code comment asserting a decision outlives whoever could correct it.

              On the landing this
              block is a four-item TEASER, so a curation standard answers a question the visitor has not
              asked yet; by /portfolio they have seen the shelf. The landing is also where a correction
              costs most (CloudFront, plus the OG card LinkedIn/X pin on first fetch).

              Opt-IN rather than opt-out, which inverts this file's other flags (`showAllLink` defaults
              off, `limit` off). Deliberate: those change layout, this publishes a CLAIM about how the
              catalog is curated, and a claim should be switched on by a caller that meant it rather than
              inherited by whoever renders the component next.

              Its own sentence rather than a clause spliced into `intro`, because the link has to sit at
              the end and splitting a translated string around an anchor is how the two editions drift.
              The target is the repo file itself — the checkable artifact, not a description of it. */}
          {showBar && (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {t('portfolio.bar')}{' '}
              <a
                href="https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[0.9em] underline invert-hover"
              >
                {t('portfolio.barLink')}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="px-[--gutter] pb-[clamp(2.5rem,5vw,4rem)] md:col-span-9 md:border-l md:border-border md:pl-8 md:pt-[clamp(2rem,4vw,3.5rem)]">
        {shown.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            {t('portfolio.emptyLead')}{' '}
            <a href="https://github.com/tedeuxx" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {t('portfolio.emptyLink')}
            </a>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        )}

        {showAllLink && (
          <RouterLink
            to={lp('/portfolio')}
            className="mt-6 inline-block border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
          >
            {t('portfolio.viewAll')}
          </RouterLink>
        )}
      </div>
    </div>
  );
}
