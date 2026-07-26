// Static GitHub repo card (/frontend/markdown, issue #122 / ADR-0035). Rendered by the shared <Markdown>
// when a long-form paragraph is nothing but a curated repo URL (see Markdown.tsx + data/repoCards.ts) —
// the same lone-URL→component facade as VideoEmbed, but for a repo instead of a video.
//
// It is PURE static text plus ONE outbound anchor: no <img> from a GitHub/OG CDN, no iframe, no third-
// party script, no network. That is the whole point over GitHub's OG-card image (ADR-0035) — a card that
// costs the reader nothing. The whole surface is a single <a> (one destination, unlike the catalog's
// ProjectCard which carries repo + live), so it satisfies "exactly one anchor per card" and stays
// keyboard-reachable as one control. Brand: obeys ADR-0008 (radius 0, no shadow/gradient, mono + accent).
import { useLocale } from '../i18n';
import type { RepoCardData } from '../data/repoCards';

export function RepoCard({ repo }: { repo: RepoCardData }) {
  const { locale, t } = useLocale();
  return (
    <a
      href={repo.repoUrl}
      target="_blank"
      rel="noreferrer"
      data-testid="repo-card"
      className="group my-4 flex flex-col gap-2 border border-border p-5 no-underline transition-colors duration-150 hover:bg-foreground hover:text-background"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-mono text-[1.05rem] font-bold leading-tight tracking-[-0.01em] group-hover:text-primary">
          {repo.owner}/{repo.name}
        </span>
        <span className="shrink-0 border border-current px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em]">
          {repo.language}
        </span>
      </span>

      <span className="block text-[15px] leading-relaxed opacity-80">{repo.description[locale]}</span>

      <span className="mt-1 block font-mono text-xs uppercase tracking-wider group-hover:underline">
        <span className="text-primary">→</span> {t('portfolio.viewGithub')}
      </span>
    </a>
  );
}
