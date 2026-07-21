// Portfolio section (/frontend/design-system) — renders the curated catalog as GitHub-linked cards.
// Pure/presentational: data comes from ../data/catalog, so it's trivially testable and has no backend
// dependency. Used both on the landing (/) and the dedicated /portfolio page.
import { Boxes, Github, ExternalLink } from 'lucide-react';
import { catalog, type CatalogProject } from '../data/catalog';

function StatusBadge({ status }: { status: CatalogProject['status'] }) {
  if (!status) return null;
  const label = status === 'live' ? 'Live' : 'WIP';
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function ProjectCard({ project }: { project: CatalogProject }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 font-display font-bold hover:text-primary"
        >
          <Github size={16} className="shrink-0 text-muted-foreground" />
          {project.name}
        </a>
        <StatusBadge status={project.status} />
      </div>
      <p className="text-sm font-medium text-foreground/90">{project.tagline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
      {project.stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <span key={tech} className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
              {tech}
            </span>
          ))}
        </div>
      )}
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink size={14} /> Ver ao vivo
        </a>
      )}
    </div>
  );
}

// `embedded` (default) renders the section chrome (top border + heading) so it sits inside the CV
// flow on the landing; the standalone /portfolio page passes embedded={false} (its ColumnHeader
// already provides the title).
export function PortfolioSection({ embedded = true }: { embedded?: boolean }) {
  return (
    <section className={embedded ? 'border-t border-border px-4 py-5' : 'px-4 py-5'}>
      {embedded && (
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <span className="text-primary">
            <Boxes size={18} />
          </span>
          Portfólio
        </h2>
      )}
      {catalog.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">
          Catálogo em construção.{' '}
          <a
            href="https://github.com/tedeuxx"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Acompanhe no GitHub
          </a>
          .
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
