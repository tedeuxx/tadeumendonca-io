// Shared markdown renderer (/frontend/markdown) — react-markdown + rehype-highlight for code blocks,
// consistent with the edge prerender. highlight.js theme is imported once here. react-markdown
// sanitizes by default (no raw HTML), so this is safe for user-authored content.
//
// Video embeds: a paragraph that is nothing but a YouTube link becomes a lazy <VideoEmbed> facade.
// That keeps videos INSIDE articles without rehype-raw or a bare iframe — the sanitizer stays on.
// Repo cards: the same lone-URL facade, for a curated GitHub repo — a paragraph that is only a registered
// repo URL becomes a static <RepoCard> (data/repoCards.ts). Both are opt-in by URL; anything else, and any
// unregistered URL, stays a plain link.
import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { VideoEmbed, youtubeId } from './VideoEmbed';
import { RepoCard } from './RepoCard';
import { repoCardFor } from '../data/repoCards';

/**
 * The URL of a paragraph that is nothing but a link: either a bare URL on its own line (plain text,
 * since we don't enable GFM autolinking) or an explicit `[url](url)` whose label IS its href.
 * Anything with surrounding prose is left alone — an inline link must stay an inline link.
 */
function loneUrl(children: ReactNode): string | null {
  const nodes = Children.toArray(children).filter((c) => typeof c !== 'string' || c.trim() !== '');
  if (nodes.length !== 1) return null;
  const only = nodes[0];
  if (typeof only === 'string') return only.trim();
  if (!isValidElement<{ href?: string; children?: ReactNode }>(only)) return null;
  const href = only.props.href;
  if (!href) return null;
  return Children.toArray(only.props.children).join('') === href ? href : null;
}

const components: Components = {
  p({ children, ...rest }) {
    // `node` is react-markdown's AST handle — it must never reach the DOM.
    const { node, ...props } = rest;
    void node;
    const url = loneUrl(children);
    if (url) {
      const id = youtubeId(url);
      if (id) return <VideoEmbed id={id} />;
      const repo = repoCardFor(url);
      if (repo) return <RepoCard repo={repo} />;
    }
    return <p {...props}>{children}</p>;
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
