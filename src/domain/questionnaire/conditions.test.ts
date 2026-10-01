import { describe, expect, it } from "vitest";
import { questionsNotApplicable, questionsToShow } from "./conditions";

const questions = [
  { code: "WAIT_TIME", conditions: [] },
  {
    code: "REPORTED",
    conditions: [{ dependsOn: "OVERALL_SATISFACTION", options: ["DISSATISFIED", "VERY_DISSATISFIED"] }],
  },
  { code: "REPORT_WHY", conditions: [{ dependsOn: "REPORTED", options: ["NO"] }] },
];
const codes = (list: { code: string }[]) => list.map((q) => q.code);

describe("questionsToShow", () => {
  it("shows the common questions only to the users not satisfied", () => {
    expect(codes(questionsToShow(questions, { OVERALL_SATISFACTION: "SATISFIED" }))).toEqual(["WAIT_TIME"]);
    const shown = questionsToShow(questions, { OVERALL_SATISFACTION: "DISSATISFIED" });
    expect(codes(shown)).toEqual(["WAIT_TIME", "REPORTED", "REPORT_WHY"]);
    expect(shown[1]!.revealedBy).toBeNull();
    // « Pourquoi ? » is on the same page as the question it depends on: revealed by « Non ».
    expect(shown[2]!.revealedBy).toEqual({ dependsOn: "REPORTED", options: ["NO"] });
  });

  it("never shows a question whose question is not shown", () => {
    expect(codes(questionsToShow(questions, { OVERALL_SATISFACTION: "NEUTRAL", REPORTED: "NO" }))).toEqual([
      "WAIT_TIME",
    ]);
  });
});

describe("questionsNotApplicable", () => {
  it("finds the answers that no longer apply once the feedback is final", () => {
    const final = (answers: Record<string, string>) => codes(questionsNotApplicable(questions, answers));
    expect(final({ OVERALL_SATISFACTION: "VERY_DISSATISFIED", REPORTED: "NO", REPORT_WHY: "POINTLESS" })).toEqual([]);
    expect(final({ OVERALL_SATISFACTION: "VERY_DISSATISFIED", REPORTED: "YES_ANSWERED", REPORT_WHY: "POINTLESS" }))
      .toEqual(["REPORT_WHY"]);
    // Became satisfied: neither question applies any more.
    expect(final({ OVERALL_SATISFACTION: "SATISFIED", REPORTED: "NO", REPORT_WHY: "POINTLESS" }))
      .toEqual(["REPORTED", "REPORT_WHY"]);
  });
});
