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
