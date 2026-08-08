/**
 * Shared HTML sanitizer for every email-body HTML sink: the rich-text editor's
 * paste handler and preview render (client), and every template/ad-hoc-send
 * write path (server, defense-in-depth against a crafted direct call to a
 * server action bypassing the client-side sanitization).
 *
 * `isomorphic-dompurify` wraps DOMPurify + jsdom so the same allowlist runs
 * in both environments. Restricted to the small tag/attribute set the
 * `RichTextEditor` toolbar can actually produce, plus a URI-scheme allowlist
 * so `javascript:`/`data:`/`vbscript:` hrefs never survive — whether typed
 * into the link prompt, pasted from an external source, or written directly
 * via a server action call.
 */
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'p', 'br', 'div', 'span'];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title'];
// http(s) covers our own storage bucket URLs (both are https); mailto for contact links.
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:)/i;

export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}
