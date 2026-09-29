/**
 * Normalizes text for search: lowercase, no accents, single spaces.
 * Must produce the same result as the SQL used to fill the search_text
 * columns (lower(unaccent(...))), so that queries and indexed values match.
 */
export function normalizeForSearch(input: string): string {
  return input
    // Ligatures are not decomposed by NFD; unaccent() expands them.
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Words ignored by the search. Must match search_terms() (migrations 0007, 0009). */
export const SEARCH_STOP_WORDS: readonly string[] = ["senegal"];

/** Expressions searched as another one (normalized). Must match search_terms() (migration 0009). */
export const SEARCH_EQUIVALENTS: readonly (readonly [string, string])[] = [["hotel de ville", "mairie"]];

/** What the search compares: normalized text, equivalents replaced, without the stop words. */
export function toSearchTerms(input: string): string {
  let text = ` ${normalizeForSearch(input)} `;
  for (const [from, to] of SEARCH_EQUIVALENTS) {
    text = text.split(` ${from} `).join(` ${to} `);
  }
  return text
    .split(" ")
    .filter((word) => word && !SEARCH_STOP_WORDS.includes(word))
    .join(" ");
}
