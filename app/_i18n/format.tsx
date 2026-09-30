import { Fragment, type ReactNode } from "react";

/** Replaces each {name} of a text by its value. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));

/** Singular or plural according to the number, following the language's rules. */
export function plural(forms: { one: string; other: string }, count: number, locale = "fr") {
  const form = new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
  return fill(form, { count });
}

const bold = (chunk: string) => <strong>{chunk}</strong>;

/**
 * Turns the tags of a text (<b>…</b>, <a>…</a>…) into elements: <b> is bold
 * by default, other tags are given by the caller. Keeps the word order of
 * each language, unlike a text cut in pieces.
 */
export function rich(text: string, tags: Record<string, (chunk: string) => ReactNode> = {}): ReactNode[] {
  const render: Record<string, (chunk: string) => ReactNode> = { b: bold, ...tags };
  // split with two groups: [text, tag, chunk, text, tag, chunk, text…]
  const parts = text.split(/<(\w+)>(.*?)<\/\1>/);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) nodes.push(parts[i]);
    if (i + 2 < parts.length) {
      const tag = render[parts[i + 1]];
      nodes.push(<Fragment key={i}>{tag ? tag(parts[i + 2]) : parts[i + 2]}</Fragment>);
    }
  }
  return nodes;
}
