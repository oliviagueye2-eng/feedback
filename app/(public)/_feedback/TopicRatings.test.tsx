import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TopicChoice, TopicGate } from "@/src/db/feedbacks";
import { TopicRatings } from "./TopicRatings";

const gate = (code: string, opensWith: string[]): TopicGate => ({
  code,
  label: `Question ${code}`,
  options: [
    { code: "A", label: "A" },
    { code: "B", label: "B" },
    { code: "C", label: "C" },
  ],
  opensWith,
  chosen: null,
});

const topic = (code: string, gates: TopicGate[]): TopicChoice => ({
  code,
  label: `Thème ${code}`,
  sentiment: null,
  otherText: null,
  gates,
  category: null,
});

const render = (topics: TopicChoice[]) =>
  renderToStaticMarkup(
    <TopicRatings
      topics={topics}
      otherCode="OTHER"
      otherMaxLength={50}
      t={{ good: "Bien", bad: "Pas bien", notConcerned: "Non concerné", otherLabel: "", otherPlaceholder: "" }}
    />,
  );

/** Where each question block and each topic comes, in the page's order. */
const layout = (html: string) =>
  [...html.matchAll(/<div[^>]*data-gate="(\w+)"|<div[^>]*data-gated-topic="(\w+)"/g)].map((m) =>
    m[1] ? `Q:${m[1]}` : `T:${m[2]}`,
  );

describe("TopicRatings", () => {
  it("asks each question once, its topics under it, each opened by its own answers", () => {
    const html = render([
      topic("X", [gate("Q1", ["A"])]),
      topic("Y", [gate("Q1", ["A", "B"])]),
      topic("Z", []),
    ]);
    expect(layout(html)).toEqual(["Q:Q1", "T:X", "T:Y"]);
    // The block opens with any answer of its topics, each topic with its own.
    expect(html).toContain(
      '[data-gate="Q1"]:not(:has(input[name="q:Q1"][value="A"]:checked, input[name="q:Q1"][value="B"]:checked)) [data-gated]',
    );
    expect(html).toContain('[data-gate="Q1"]:not(:has(input[name="q:Q1"][value="A"]:checked)) [data-gated-topic="X"]');
    expect(html).toContain(
      '[data-gate="Q1"]:not(:has(input[name="q:Q1"][value="A"]:checked, input[name="q:Q1"][value="B"]:checked)) [data-gated-topic="Y"]',
    );
  });

  it("puts a topic of two questions under the last one, shown after an opening answer to each", () => {
    const html = render([
      topic("X", [gate("Q1", ["A"]), gate("Q2", ["C"])]),
      topic("Y", [gate("Q1", ["B"])]),
    ]);
    // Q1 holds Y only; X comes under Q2, asked right after.
    expect(layout(html)).toEqual(["Q:Q1", "T:Y", "Q:Q2", "T:X"]);
    expect(html.match(/name="q:Q1" value="A"/g)).toHaveLength(1);
    // Q2 within its block, Q1 anywhere in the form: both needed.
    expect(html).toContain('[data-gate="Q2"]:not(:has(input[name="q:Q2"][value="C"]:checked)) [data-gated-topic="X"]');
    expect(html).toContain('form:not(:has(input[name="q:Q1"][value="A"]:checked)) [data-gated-topic="X"]');
  });
});
