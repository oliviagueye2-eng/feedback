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

/** Words ignored by the search. Must match search_terms() in migration 0007. */
export const SEARCH_STOP_WORDS: readonly string[] = ["senegal"];

/** What the search compares: normalized text without the stop words. */
export function toSearchTerms(input: string): string {
  return normalizeForSearch(input)
    .split(" ")
    .filter((word) => word && !SEARCH_STOP_WORDS.includes(word))
    .join(" ");
}
