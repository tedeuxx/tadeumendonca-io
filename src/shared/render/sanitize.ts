// HTML sanitization for rich article bodies (/backend/content-safety). The Phase-4 editor (TipTap)
// produces HTML; we sanitize it SERVER-SIDE on save (authoritative — the client is never trusted) with
// a strict allow-list. sanitize-html is Node-native (htmlparser2, no jsdom) so it bundles cleanly into
// the Lambda. The reader (fed) re-sanitizes with DOMPurify for defense-in-depth.
import sanitizeHtml from 'sanitize-html';

// Allow only the formatting the editor can produce: headings, emphasis, lists, quotes, code, links,
// images (assets bucket + Giphy CDN), rules, line breaks. No scripts/styles/iframes/event handlers.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'strong', 'em', 'u', 's', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] }, // images only over https (assets CDN + Giphy)
  // Force safe link rel; keep target if present.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
  },
  disallowedTagsMode: 'discard',
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
