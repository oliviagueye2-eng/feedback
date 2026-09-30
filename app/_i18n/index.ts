import type { Dictionary } from "./fr";
import { frenchSpaces } from "./typography";

export type { Dictionary };

/**
 * Languages of the interface. Only French for now: there is no language choice
 * yet. Adding one: a dictionary file (wo.ts…) and a line in `dictionaries`.
 */
export const locales = ["fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Loaded on demand: a page only carries the texts of its own language.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("./fr").then((module) => module.fr),
};

/** Applies a text transformation to every text of a dictionary. */
function mapTexts<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === "string") return transform(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapTexts(v, transform)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapTexts(v, transform)])) as T;
  }
  return value;
}

const loaded = new Map<Locale, Promise<Dictionary>>();

/**
 * The texts of the interface, for server components. Client components receive
 * the texts they need from the page, as props: they never load a dictionary.
 */
export function getDictionary(locale: Locale = defaultLocale): Promise<Dictionary> {
  let dictionary = loaded.get(locale);
  if (!dictionary) {
    dictionary = dictionaries[locale]().then((d) => (locale === "fr" ? mapTexts(d, frenchSpaces) : d));
    loaded.set(locale, dictionary);
  }
  return dictionary;
}
