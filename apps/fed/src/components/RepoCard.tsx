// Static GitHub repo card (/frontend/markdown, issue #122 / ADR-0035). Rendered by the shared <Markdown>
// when a long-form paragraph is nothing but a curated repo URL (see Markdown.tsx + data/repoCards.ts) —
// the same lone-URL→component facade as VideoEmbed, but for a repo instead of a video.
//
// It is PURE static text plus ONE outbound anchor: no <img> from a GitHub/OG CDN, no iframe, no third-
// party script, no network. That is the whole point over GitHub's OG-card image (ADR-0035) — a card that
// costs the reader nothing. The whole surface is a single <a> (one destination, unlike the catalog's
// ProjectCard which carries repo + live), so it satisfies "exactly one anchor per card" and stays
// keyboard-reachable as one control. Brand: obeys ADR-0008 (radius 0, no shadow/gradient, mono + accent).
//
// The mark is `GithubMark` from BrandIcons, NOT lucide's `Github`. #318 asked for lucide; BrandIcons
// exists precisely because lucide's GitHub icon is a line-art approximation, and this is the same mark
// the footer's contact channels render — a second GitHub glyph on one site would be a visible
// inconsistency, not a detail. It is `aria-hidden` and carries no accessible name: the card already
// says "view on GitHub" in words, and a decorative mark that announces itself is a duplicate label.
import { useLocale } from '../i18n';
import { GithubMark } from './BrandIcons';
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
        {/* `min-w-0` + `break-words` are load-bearing, not defensive. A flex item's default `min-width:
            auto` refuses to shrink below its content, and `tedeuxx/tadeumendonca-skills` is a single
            unbreakable token wide enough to push a 320px viewport sideways — which is exactly what it did
            (`/pt/architecture` overflowed by 64px) the first time these two repos were registered. The
            earlier cards all had short names, so the constraint existed and nothing had met it. */}
        <span className="flex min-w-0 items-center gap-2 font-mono text-[1.05rem] font-bold leading-tight tracking-[-0.01em] group-hover:text-primary">
          {/* `text-primary` is deliberate and deliberately REDUNDANT here, which is worth a line because
              it looks removable. Inside `.markdown` the mark is already accent-coloured twice over —
              `.markdown a` paints every anchor in the accent at rest, and this span's own
              `group-hover:text-primary` carries it on hover — so deleting the class changes nothing that
              renders (checked by mutation; no E2E state distinguishes it). It stays because the
              REQUIREMENT is the component's, not the container's: #318 asked for a mark in the accent,
              and a card dropped outside `.markdown` should still satisfy that rather than turning
              near-black wherever it lands. */}
          <GithubMark className="shrink-0 text-primary" />
          <span className="min-w-0 break-words">
            {repo.owner}/{repo.name}
          </span>
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
