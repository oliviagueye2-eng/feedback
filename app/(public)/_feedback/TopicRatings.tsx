"use client";

import { useState, type ReactNode } from "react";
import type { TopicChoice, TopicGate, TopicSentiment } from "@/src/db/feedbacks";
import styles from "./screen.module.css";

const ThumbIcon = ({ down = false }: { down?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={down ? styles.thumbDown : undefined}
  >
    <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" />
  </svg>
);

/** « Non concerné »: a circle with a dash, quieter than the thumbs. */
const NotConcernedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8 12h8" />
  </svg>
);

const RATING_CLASS: Record<TopicSentiment, string | undefined> = {
  positive: styles.ratingGood,
  negative: styles.ratingBad,
  not_concerned: styles.ratingNeutral,
};

/**
 * Screen 2b, option D: each topic can be marked « Bien », « Pas bien » or
 * « Non concerné », or left untouched. Touching the chosen answer again
 * removes it. Real radio buttons (one group per topic, named "topic:CODE"):
 * without JavaScript the form still works, only the removal needs it.
 * « Autre » opens a short field once it is marked.
 *
 * A topic shown only after an answer (« Frais payés » after « Oui » to « Avez-
 * vous payé quelque chose ? ») comes under its question, asked in the place of
 * the first of its topics ("q:CODE"). Each topic stays hidden until one of its
 * own opening answers is touched, where the browser knows :has(); elsewhere it
 * stays visible and the server ignores it without it. A topic with several
 * questions (none today) shows after an opening answer to each, like the
 * server checks it, under the last of them.
 */
export function TopicRatings({
  topics,
  otherCode,
  otherMaxLength,
  t,
  notes,
}: {
  topics: TopicChoice[];
  otherCode: string;
  otherMaxLength: number;
  /** Texts given by the page. */
  t: { good: string; bad: string; notConcerned: string; otherLabel: string; otherPlaceholder: string };
  /**
   * Back office only (generated form): notes under a topic's label and
   * under a question, by their codes (where they come from, when they show).
   */
  notes?: { topics?: Record<string, ReactNode>; gates?: Record<string, ReactNode> };
}) {
  const [chosen, setChosen] = useState<Record<string, TopicSentiment | null>>(() =>
    Object.fromEntries(topics.map((topic) => [topic.code, topic.sentiment])),
  );
  const [answers, setAnswers] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(topics.flatMap((topic) => topic.gates.map((gate) => [gate.code, gate.chosen]))),
  );

  // A click on the answer already chosen clears the topic (or the question).
  const toggle = (code: string, sentiment: TopicSentiment) =>
    setChosen((current) => ({ ...current, [code]: current[code] === sentiment ? null : sentiment }));
  const answer = (code: string, option: string) =>
    setAnswers((current) => ({ ...current, [code]: current[code] === option ? null : option }));

  // Each question once, in the place of the first topic it opens; a topic
  // under the last of its questions there (its anchor).
  const questions = new Map<string, TopicGate>();
  for (const gate of topics.flatMap((topic) => topic.gates)) if (!questions.has(gate.code)) questions.set(gate.code, gate);
  const order = [...questions.keys()];
  const anchorOf = (topic: TopicChoice) =>
    topic.gates.reduce<string | null>(
      (last, gate) => (last === null || order.indexOf(gate.code) > order.indexOf(last) ? gate.code : last),
      null,
    );
  const opened = (code: string, answers: string[]) =>
    [...new Set(answers)].map((o) => `input[name="q:${code}"][value="${o}"]:checked`).join(", ") || ":not(*)";

  const topicRow = (topic: TopicChoice) => {
    const labelId = `topic-${topic.code}`;
    const choice = (sentiment: TopicSentiment, text: string, icon: ReactNode) => (
      <label className={`${styles.rating} ${RATING_CLASS[sentiment]}`}>
        <input
          type="radio"
          name={`topic:${topic.code}`}
          value={sentiment}
          checked={chosen[topic.code] === sentiment}
          onChange={() => {}}
          onClick={() => toggle(topic.code, sentiment)}
        />
        {icon}
        <span>{text}</span>
      </label>
    );
    return (
      <div key={topic.code} className={styles.topicRow} data-gated-topic={topic.gates.length > 0 ? topic.code : undefined}>
        <div className={styles.topicLine} role="radiogroup" aria-labelledby={labelId}>
          <span id={labelId} className={styles.topicLabel}>
            {topic.label}
          </span>
          {notes?.topics?.[topic.code]}
          <span className={styles.ratings}>
            {choice("positive", t.good, <ThumbIcon />)}
            {choice("negative", t.bad, <ThumbIcon down />)}
            {choice("not_concerned", t.notConcerned, <NotConcernedIcon />)}
          </span>
        </div>
        {topic.code === otherCode && (
          <input
            name="otherText"
            className={styles.otherField}
            aria-label={t.otherLabel}
            placeholder={t.otherPlaceholder}
            maxLength={otherMaxLength}
            defaultValue={topic.otherText ?? ""}
            autoComplete="off"
          />
        )}
      </div>
    );
  };

  // Hidden: the block's topics until an answer opens one of them, and each
  // topic until each of its questions got one of its own opening answers
  // (its anchor's within the block, the others' anywhere in the form).
  const visibility = (gate: TopicGate, gated: TopicChoice[]) =>
    [
      `[data-gate="${gate.code}"]:not(:has(${opened(gate.code, gated.flatMap((topic) => topic.gates.find((g) => g.code === gate.code)!.opensWith))})) [data-gated] { display: none; }`,
      ...gated.flatMap((topic) =>
        topic.gates.map(
          (g) =>
            `${g.code === gate.code ? `[data-gate="${gate.code}"]` : "form"}:not(:has(${opened(g.code, g.opensWith)})) [data-gated-topic="${topic.code}"] { display: none; }`,
        ),
      ),
    ].join(" ");

  const gateBlock = (gate: TopicGate, gated: TopicChoice[]) => {
    const labelId = `gate-${gate.code}`;
    return (
      <div key={`gate:${gate.code}`} className={styles.gateGroup} data-gate={gate.code}>
        <style>{`@supports selector(:has(*)) { ${visibility(gate, gated)} }`}</style>
        <div className={styles.gateLine} role="radiogroup" aria-labelledby={labelId}>
          <span id={labelId} className={styles.gateLabel}>
            {gate.label}
          </span>
          <span className={styles.gateOptions}>
            {gate.options.map((option) => (
              <label key={option.code} className={styles.gateOption}>
                <input
                  type="radio"
                  name={`q:${gate.code}`}
                  value={option.code}
                  checked={answers[gate.code] === option.code}
                  onChange={() => {}}
                  onClick={() => answer(gate.code, option.code)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </span>
          {notes?.gates?.[gate.code]}
        </div>
        <div className={styles.gated} data-gated="">
          {gated.map(topicRow)}
        </div>
      </div>
    );
  };

  // The title of each category above its first topic (the topics come in
  // the order of the categories).
  const asked = new Set<string>();
  return topics.flatMap((topic, i) => {
    const blocks = topic.gates
      .filter((gate) => !asked.has(gate.code))
      .map((gate) => {
        asked.add(gate.code);
        return gateBlock(questions.get(gate.code)!, topics.filter((other) => anchorOf(other) === gate.code));
      });
    if (topic.gates.length > 0 && blocks.length === 0) return [];
    const title =
      topic.category && topic.category !== topics[i - 1]?.category ? (
        <h3 key={`category:${topic.category}`} className={styles.categoryTitle}>
          {topic.category}
        </h3>
      ) : null;
    const items = topic.gates.length > 0 ? blocks : [topicRow(topic)];
    return title ? [title, ...items] : items;
  });
}
