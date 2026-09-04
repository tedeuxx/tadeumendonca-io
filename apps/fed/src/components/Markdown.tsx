// Shared markdown renderer (/frontend/markdown) — react-markdown + remark-gfm for tables and
// autolinks + rehype-highlight for code blocks, consistent with the edge prerender. highlight.js theme
// is imported once here. react-markdown sanitizes by default (no raw HTML), so this is safe for
// user-authored content — and remark-gfm does not change that: it is a remark (source) plugin and
// grants no HTML passthrough.
//
// Video embeds: a paragraph that is nothing but a YouTube link becomes a lazy <VideoEmbed> facade.
// That keeps videos INSIDE articles without rehype-raw or a bare iframe — the sanitizer stays on.
// Repo cards: the same lone-URL facade, for a curated GitHub repo — a paragraph that is only a registered
// repo URL becomes a static <RepoCard> (data/repoCards.ts). Both are opt-in by URL; anything else, and any
// unregistered URL, stays a plain link.
// Photographs: the SAME lone-paragraph facade, for a registered content photograph (#415) — a paragraph
// that is only `![alt](/photos/x.jpg "caption")` becomes a <PhotoFigure> with the committed file's
// intrinsic size. Opt-in by src (data/photos.ts); an unregistered image target stays a plain <img>.
import { Children, isValidElement, type AnchorHTMLAttributes, type ReactNode, type RefObject } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { VideoEmbed, youtubeId } from './VideoEmbed';
import { RepoCard } from './RepoCard';
import { Diagram } from './Diagram';
import { VennFence } from './VennDiagram';
import { AdrTable } from './AdrTable';
import { PhotoFigure } from './PhotoFigure';
import { repoCardFor } from '../data/repoCards';
import { photoFor } from '../data/photos';
import { useLocalePath } from '../i18n';
import { isInternalHref } from '../lib/markdownLinks';

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
 * wearing a leading slash). Absolute URLs, `mailto:` and in-page `#anchor` links are untouched.
 *
 * THE PREDICATE ITSELF NOW LIVES IN `lib/markdownLinks` (#387) — the copy-as-markdown payload has to make
 * exactly this set of links absolute, and two places deciding one rule is how the renderer and the
 * clipboard would come to disagree about a link nobody checked.
 *
 * "EXACTLY THIS SET" MEANS ANCHORS, and it is worth saying which handler is missing rather than which are
 * present: this file registers `a`, `pre`, `table` and `p`, and STILL NO `img`. #415 added photographs to
 * a content body and did NOT change that — the facade is on `p`, for the reason `isAdrIndex` and
 * `mermaidBlock` already record twice: react-markdown delivers a lone image as `<p><img></p>`, so an `img`
 * handler returning a <figure> would nest a block element inside a paragraph, which is invalid HTML and a
 * hydration mismatch on a prerendered page.
 *
 * So an image target is never localized here — the browser resolves it against the origin — and that half
 * is unchanged. THE HALF THAT DID CHANGE is what `shareMarkdown.ts` does about it: it no longer leaves
 * image targets alone, it absolutizes them to the ORIGIN, without the locale prefix, precisely BECAUSE
 * this file does not localize them. Four photographs turned a residual it had recorded as inert into four
 * broken references in every copied payload. See `absolutizeTargets` there — one function handles both
 * halves, and its doc block carries the whole argument for why they differ by exactly `localizePath`.
 */
function MarkdownLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Called unconditionally, before the branch — a hook behind an `if` is a hook that changes order
  // between a link with an href and one without.
  const lp = useLocalePath();
  if (isInternalHref(href)) {
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
 * A ```venn fence's body, if this <pre> is one.
 *
 * A SECOND fence kind, and the bar for adding one is the bar the `adr-index` comment sets: a second
 * mechanism for the same job is a second thing to learn and to break. This is not the same job. mermaid
 * cannot draw overlapping circles, and the three-pillar figure is exactly that — see the header of
 * `VennDiagram.tsx` for what the separate path costs.
 *
 * Unlike `mermaidBlock` this returns the RAW body and validates nothing: `parseVennSpec` owns the
 * grammar, throws on every authoring mistake, and is unit-tested without a renderer. Splitting the check
 * out is what keeps the "must declare a caption" rule in one place per fence kind rather than here.
 */
function vennBlock(children: ReactNode): string | null {
  const only = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string; children?: ReactNode }>(only)) return null;
  if (!only.props.className?.split(/\s+/).includes('language-venn')) return null;
  return Children.toArray(only.props.children).join('');
}

/**
 * The URL of a paragraph that is nothing but a link — an explicit `[url](url)` whose label IS its href,
 * or a bare URL on its own line, which GFM autolinks into exactly that shape.
 * Anything with surrounding prose is left alone — an inline link must stay an inline link.
 *
 * THE STRING BRANCH IS NOW THE DEAD-ISH ONE, and that is the change worth flagging. Before
 * `remark-gfm`, a bare URL arrived here as PLAIN TEXT and the `typeof only === 'string'` branch is what
 * every lone URL in `rampup.{pt,en}.md` hit. GFM autolinks them, so those 22 URLs now arrive as an <a>
 * and take the element branch instead. They still resolve because an autolink's label equals its href —
 * which is the element branch's exact condition, and is asserted rather than assumed in Markdown.test.tsx.
 *
 * The string branch is kept because it is not reachable-only-under-GFM: `<https://x>` and any future
 * plugin change put a bare string back here, and a facade that silently stopped working would look like
 * a content bug rather than a renderer one.
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

/**
 * The image of a paragraph that is nothing but one image — react-markdown's delivery shape for a lone
 * `![alt](/src "caption")` on its own line, which is `<p><img></p>`.
 *
 * A `p` FACADE RATHER THAN AN `img` HANDLER, and the reason is written twice already in this file: a
 * handler on `img` that returned a <figure> would nest a block element inside the <p> react-markdown has
 * already opened — invalid HTML, and a hydration mismatch on a prerendered page, which is the same defect
 * `isAdrIndex` and `mermaidBlock` avoid by hooking `pre` instead of `code`. This is the shape the file
 * already uses three times (VideoEmbed, RepoCard, the table wrapper), so it is not a fourth mechanism.
 *
 * The MARKDOWN TITLE SLOT is the caption. That keeps authoring in standard CommonMark — it renders on
 * GitHub, `shareMarkdown.ts`'s `LINK_TARGET` already captures the title as group 4 so captions round-trip
 * for free, and the words stay in the content file per locale rather than in a component nobody
 * translating the page would think to open.
 *
 * A paragraph mixing an image with prose is left ALONE, exactly as `loneUrl` leaves an inline link alone:
 * an inline image must stay an inline image, and the figure treatment is opt-in by being the whole
 * paragraph. Whitespace-only siblings are filtered for the same reason `loneUrl` filters them — the
 * parser leaves them around a lone child and they are not content.
 */
function loneImage(children: ReactNode): { src?: string; alt?: string; title?: string } | null {
  const nodes = Children.toArray(children).filter((c) => typeof c !== 'string' || c.trim() !== '');
  if (nodes.length !== 1) return null;
  const only = nodes[0];
  if (!isValidElement<{ src?: string; alt?: string; title?: string }>(only)) return null;
  if (only.type !== 'img') return null;
  return { src: only.props.src, alt: only.props.alt, title: only.props.title };
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
    const venn = vennBlock(children);
    if (venn) return <VennFence body={venn} />;
    return <pre {...props}>{children}</pre>;
  },
  /**
   * A GFM table, wrapped in its own scroll container.
   *
   * Not cosmetic and not optional: a <table> does not wrap. The moment the tables started rendering,
   * `/pt/architecture` pushed the whole PAGE sideways at 320px and the overflow sweep went red — the
   * same failure `.markdown code`'s `overflow-wrap` comment already describes, and the reason
   * `.markdown pre` carries `overflow-x: auto`. The table scrolls instead of the document.
   *
   * A WRAPPER rather than `display: block` on the table itself, which is the other common fix: changing
   * a table's display drops its table semantics for some screen readers, and this page's other table
   * (`AdrTable`) already solves it exactly this way — a scrolling div around an untouched table. Two
   * tables on one page resolving the same problem differently is how the next person picks the wrong one.
   *
   * `tabIndex={0}` because a scrollable region that only a mouse can pan is unreachable by keyboard.
   *
   * `data-markdown-table` is a TEST HOOK and is load-bearing for one reason: `AdrTable` renders a wrapper
   * with these same classes, but it is `w-full` and is MEANT to fit rather than scroll. A selector that
   * cannot tell the two apart asserts the wrong invariant on one of them — which it did, on first run.
   *
   * The `min-width` that makes the container engage lives in the stylesheet with the other `.markdown`
   * rules — see `.markdown table` in `styles/index.css` for why it exists.
   */
  table({ children, ...rest }) {
    const { node, ...props } = rest;
    void node;
    return (
      <div className="my-8 overflow-x-auto border border-border" tabIndex={0} data-markdown-table="">
        <table className="w-full border-collapse text-left text-sm" {...props}>
          {children}
        </table>
      </div>
    );
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
    const image = loneImage(children);
    if (image) {
      const photo = photoFor(image.src);
      // BOTH WORDS ARE REQUIRED, and a missing one is a hard failure rather than a silent unlabelled
      // figure — the same rule `mermaidBlock` applies to `accTitle:` and for the same reason. An empty
      // alt on a photograph that carries a quotation publishes it to nobody using a screen reader; an
      // empty caption publishes a holiday snapshot with no stated reason to be on the page, which is
      // exactly what this Issue's editorial bar rejects. Failing loudly here is what makes the e2e
      // "non-empty alt and caption" assertion a second line of defence rather than the only one.
      if (photo) {
        if (!image.alt) throw new Error(`A photograph must carry alt text — ${photo.src} has none.`);
        if (!image.title)
          throw new Error(`A photograph must carry a caption (the markdown title slot) — ${photo.src}.`);
        return <PhotoFigure photo={photo} alt={image.alt} caption={image.title} />;
      }
    }
    return <p {...props}>{children}</p>;
  },
};

export function Markdown({
  children,
  blockRef,
}: {
  children: string;
  /**
   * A ref onto THIS component's own wrapper — the element whose children are the rendered blocks
   * (#597). `ArticlePage`'s reading-progress observer needs the last PARAGRAPH of the prose, and the
   * only way to reach it from outside is to be handed the element that parents the blocks.
   *
   * Passed rather than resolved by the caller, because every way of resolving it from the outside is a
   * guess that fails silently: a ref on the caller's own wrapper sees exactly one child (this div), and
   * an observer built from that watches the whole prose as a single block — which is a defect the unit
   * suite could not see, since a test harness rendering paragraphs directly has the shape the caller
   * only APPEARS to have. It cost a red E2E to find, which is the cheapest place it could have been
   * found and is why the coupling is explicit here instead.
   *
   * NO NODE IS ADDED. The div already existed; this only names it.
   */
  blockRef?: RefObject<HTMLDivElement>;
}) {
  return (
    <div ref={blockRef} className="markdown">
      {/* `mermaid` is declared plain text, not highlighted. It is not a registered language, and
          highlighting rewrites the source into <span>s — which the diagram handler then reads back as
          its lookup key, so every diagram would silently miss. */}
      {/* `remark-gfm` is what makes a pipe table a <table>. react-markdown is CommonMark-only and
          a table is a GFM extension, so without this the pipes render as literal text in a <p> — which is
          how two tables shipped to /architecture unrendered. It also enables autolink literals, which is
          the one behaviour change to be aware of: see `loneUrl` above. */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { plainText: ['mermaid', 'venn'] }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
