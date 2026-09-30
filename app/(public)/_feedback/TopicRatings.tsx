"use client";

import { useState } from "react";
import type { TopicChoice, TopicSentiment } from "@/src/db/feedbacks";
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

/**
 * Screen 2b, option D: each topic can be marked « Bien » or « Pas bien », or
 * left untouched. Touching the chosen answer again removes it. Real radio
 * buttons (one group per topic, named "topic:CODE"): without JavaScript the
 * form still works, only the removal needs it. « Autre » opens a short field
 * once it is marked.
 */
export function TopicRatings({
  topics,
  otherCode,
  otherMaxLength,
  t,
}: {
  topics: TopicChoice[];
  otherCode: string;
  otherMaxLength: number;
  /** Texts given by the page. */
  t: { good: string; bad: string; otherLabel: string; otherPlaceholder: string };
}) {
  const [chosen, setChosen] = useState<Record<string, TopicSentiment | null>>(() =>
    Object.fromEntries(topics.map((topic) => [topic.code, topic.sentiment])),
  );

  // A click on the answer already chosen clears the topic.
  const toggle = (code: string, sentiment: TopicSentiment) =>
    setChosen((current) => ({ ...current, [code]: current[code] === sentiment ? null : sentiment }));

  return topics.map((topic) => {
    const labelId = `topic-${topic.code}`;
    const choice = (sentiment: TopicSentiment, text: string) => (
      <label className={`${styles.rating} ${sentiment === "positive" ? styles.ratingGood : styles.ratingBad}`}>
        <input
          type="radio"
          name={`topic:${topic.code}`}
          value={sentiment}
          checked={chosen[topic.code] === sentiment}
          onChange={() => {}}
          onClick={() => toggle(topic.code, sentiment)}
        />
        <ThumbIcon down={sentiment === "negative"} />
        <span>{text}</span>
      </label>
    );
    return (
      <div key={topic.code} className={styles.topicRow}>
        <div className={styles.topicLine} role="radiogroup" aria-labelledby={labelId}>
          <span id={labelId} className={styles.topicLabel}>
            {topic.label}
          </span>
          <span className={styles.ratings}>
            {choice("positive", t.good)}
            {choice("negative", t.bad)}
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
  });
}
