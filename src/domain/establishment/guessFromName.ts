import { normalizeForSearch } from "../../lib/text";
import type { EstablishmentType } from "../types";

/** Words dropped at the start of the locality: « mairie de Touba » gives Touba. */
const LINK_WORDS = ["de", "du", "des", "d", "la", "le", "les", "l", "a", "au", "aux"];

/**
 * The phrases that name a type: its label without what is in brackets, and
 * each side of « ou » (« Tribunal ou cour »: tribunal, cour), except a side
 * that only completes the other (« … sociale ou de retraite »).
 */
function typePhrases(label: string): string[][] {
  const plain = label.replace(/\([^)]*\)/g, " ");
  const sides = plain.split(/\sou\s/i);
  return [plain, ...(sides.length > 1 ? sides : [])]
    .map((side) => normalizeForSearch(side).split(" ").filter(Boolean))
    .filter((words) => words.length > 0 && !LINK_WORDS.includes(words[0]));
}

/**
 * Screen 0c: what the name typed says about the establishment. The type is
 * found when the name holds one type's label (the longest one; none when two
 * types tie); the locality is then the rest of the name, as typed (« mairie
 * Touba »: Mairie, Touba). Both are only a starting point the user can change.
 */
export function guessFromName(
  name: string,
  types: EstablishmentType[],
): { type: EstablishmentType | null; locality: string } {
  const tokens = name.split(/\s+/).filter(Boolean);
  // Each normalized word, with the token it comes from (« tout-petits » gives two words).
  const words = tokens.flatMap((token, index) =>
    normalizeForSearch(token).split(" ").filter(Boolean).map((word) => ({ word, index })),
  );

  let best: { type: EstablishmentType; length: number; from: number; to: number } | null = null;
  let tie = false;
  for (const type of types) {
    for (const phrase of typePhrases(type.label)) {
      for (let start = 0; start + phrase.length <= words.length; start++) {
        if (!phrase.every((word, i) => words[start + i].word === word)) continue;
        const match = { type, length: phrase.length, from: words[start].index, to: words[start + phrase.length - 1].index };
        if (!best || match.length > best.length) {
          best = match;
          tie = false;
        } else if (match.length === best.length && match.type.code !== best.type.code) {
          tie = true;
        }
      }
    }
  }
  if (!best || tie) return { type: null, locality: "" };

  const rest = [...tokens.slice(0, best.from), ...tokens.slice(best.to + 1)];
  while (rest.length > 0) {
    const first = normalizeForSearch(rest[0]).split(" ");
    if (first.length === 1 && LINK_WORDS.includes(first[0])) {
      rest.shift();
    } else if (LINK_WORDS.includes(first[0]) && /^[dl]['’]/i.test(rest[0])) {
      // « d'Oussouye », « l'Île »: the elision goes, the name stays.
      rest[0] = rest[0].slice(2);
      break;
    } else {
      break;
    }
  }
  const locality = rest.join(" ").replace(/^[\s,;:–-]+|[\s,;:–-]+$/g, "");
  return { type: best.type, locality };
}
