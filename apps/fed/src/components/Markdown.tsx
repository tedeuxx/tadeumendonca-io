// Shared markdown renderer (/frontend/markdown) — react-markdown + rehype-highlight for code blocks,
// consistent with the edge prerender. highlight.js theme is imported once here. react-markdown
// sanitizes by default (no raw HTML), so this is safe for user-authored content.
//
// Video embeds: a paragraph that is nothing but a YouTube link becomes a lazy <VideoEmbed> facade.
// That keeps videos INSIDE articles without rehype-raw or a bare iframe — the sanitizer stays on.
// Repo cards: the same lone-URL facade, for a curated GitHub repo — a paragraph that is only a registered
// repo URL becomes a static <RepoCard> (data/repoCards.ts). Both are opt-in by URL; anything else, and any
// unregistered URL, stays a plain link.
import { Children, isValidElement, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { VideoEmbed, youtubeId } from './VideoEmbed';
import { RepoCard } from './RepoCard';
import { Diagram } from './Diagram';
import { AdrTable } from './AdrTable';
import { repoCardFor } from '../data/repoCards';
import { useLocalePath } from '../i18n';

/**
 * A link markdown authored, with SITE-INTERNAL ones localized and routed (#166).
 *
 * The problem this closes: markdown is authored once per locale but a site path is not. `[Biblioteca]
 * (/library)` written in `rampup.pt.md` would render as a bare `/library` — a path this site does not
 * prerender and never advertises, which resolves only by a client-side redirect that reads the BROWSER's
 * language. So a Portuguese page would hand a reader with an English browser the English shelf, which is
 * precisely the property ADR-0036's locale prefix exists to deliver and the defect #204 fixed for
 * articles. Everywhere else on the site the fix is already in place — `AppShell` builds every nav href
 * through `useLocalePath` — and markdown was the one surface that could not.
 *
 * Authors therefore write the LOGICAL path (`/library`) and this resolves it to the active locale's real,
 * prerendered URL (`/pt/library`), through react-router so it is a navigation rather than a full reload.
 * That also keeps the two editions authoring the identical link text, which is what the ramp-up parity
 * guard compares.
 *
 * SCOPE, narrow on purpose: only `/`-rooted paths, and not `//host` (protocol-relative, an external URL
 * wearing a leading slash). Absolute URLs, `mailto:` and in-page `#anchor` links are untouched, so this
 * is inert on every markdown file that exists today — none of them authored a root-relative link.
 */
function MarkdownLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Called unconditionally, before the branch — a hook behind an `if` is a hook that changes order
  // between a link with an href and one without.
  const lp = useLocalePath();
  const internal = href !== undefined && href.startsWith('/') && !href.startsWith('//');
  if (internal) {
    return (
      <RouterLink to={lp(href)} {...props}>
        {children}
      </RouterLink>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

/**
 * Whether this <pre> is the ```adr-index marker (#318).
 *
 * A fence rather than a heading convention or an HTML comment, because `pre` is already the hook where
 * this file swaps a compiled artifact in for authored source — the mermaid path directly below does the
 * same thing — and a second mechanism for the same job is a second thing to learn and to break.
 *
 * The fence carries NO content. What goes in the table is decided by `docs/adr/`, so anything typed
 * between the backticks would be either ignored or a second source of truth; the marker only says WHERE
 * the index goes. It is a `pre` for the same reason mermaid is: react-markdown wraps a fenced block in
 * <pre><code>, and returning a block element from the `code` handler nests it inside a <pre>, which is
 * invalid HTML and a hydration mismatch on a prerendered page.
 */
function isAdrIndex(children: ReactNode): boolean {
  const only = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string }>(only)) return false;
  return only.props.className?.split(/\s+/).includes('language-adr-index') ?? false;
}

/**
 * A ```mermaid fence's source, if this <pre> is one — plus the caption authored on the fence's own
 * `accTitle:` line, so the visible label and the accessible name come from the same place and cannot
 * drift apart per locale.
 *
 * Hooked on `pre` rather than `code`, and that is not stylistic: react-markdown delivers a fenced block
 * as <pre><code class="language-mermaid">, so returning a <figure> from a `code` handler nests it INSIDE
 * a <pre> — invalid HTML, and a hydration mismatch on a prerendered page.
 */
function mermaidBlock(children: ReactNode): { source: string; caption: string } | null {
  const only = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string; children?: ReactNode }>(only)) return null;
  if (!only.props.className?.split(/\s+/).includes('language-mermaid')) return null;
  const source = Children.toArray(only.props.children).join('');
  const caption = /^\s*accTitle:\s*(.+)$/m.exec(source)?.[1]?.trim();
  // No caption is a hard failure, not a silent unlabelled figure: a diagram with no accessible name is
  // invisible to a screen reader, and the whole point of inline SVG over an image was that it is not.
  if (!caption) throw new Error('A mermaid diagram must declare `accTitle:` — it is the accessible name.');
  return { source, caption };
}

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
  a({ children, ...rest }) {
    // `node` is react-markdown's AST handle — it must never reach the DOM.
    const { node, ...props } = rest;
    void node;
    return <MarkdownLink {...props}>{children}</MarkdownLink>;
  },
  pre({ children, ...rest }) {
    const { node, ...props } = rest;
    void node;
    if (isAdrIndex(children)) return <AdrTable />;
    const diagram = mermaidBlock(children);
    if (diagram) return <Diagram source={diagram.source} caption={diagram.caption} />;
    return <pre {...props}>{children}</pre>;
  },
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
      {/* `mermaid` is declared plain text, not highlighted. It is not a registered language, and
          highlighting rewrites the source into <span>s — which the diagram handler then reads back as
          its lookup key, so every diagram would silently miss. */}
      <ReactMarkdown
        rehypePlugins={[[rehypeHighlight, { plainText: ['mermaid'] }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
