/**
 * HTML entity encoding to prevent Stored XSS.
 * React escapes text by default, but this adds defense-in-depth
 * for any path where data might reach innerHTML or non-React contexts.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_RE = /[&<>"'`/]/g;

export function escapeHtml(input: string): string {
  return input.replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Strip all HTML tags from a string. Useful for "about" bio fields.
 */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a text field: trim, strip tags, escape HTML entities.
 */
export function sanitizeText(input: string): string {
  return escapeHtml(stripTags(input.trim()));
}

/**
 * Sanitize a URL field: trim, reject javascript: protocol.
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^javascript:/i.test(trimmed)) return '';
  return trimmed;
}
