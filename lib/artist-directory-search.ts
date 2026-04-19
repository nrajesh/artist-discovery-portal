/**
 * Client-safe helpers for public artist directory text search.
 */

export function stripHtmlForSearch(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildArtistKeywordHaystack(input: {
  name: string;
  specialityNames: string[];
  bioPlain: string;
  linkUrls: string[];
}): string {
  const parts = [input.name, ...input.specialityNames, input.bioPlain, ...input.linkUrls];
  return parts.join(" ").toLowerCase();
}

/** Every whitespace-separated token must appear somewhere in the haystack (order-independent). */
export function artistMatchesDirectoryQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}
