import { describe, expect, it } from "vitest";
import { monthOf, percentages, publicationPeriod, topicHighlights, wilsonInterval } from "./results";

describe("publicationPeriod", () => {
  it("counts the last 3 complete months and is published on the 1st", () => {
    expect(publicationPeriod(new Date("2026-10-03T00:17:00Z"))).toEqual({
      from: "2026-07-01",
      last: "2026-09-01",
      publishedOn: "2026-10-01",
    });
  });

  it("crosses the year", () => {
    expect(publicationPeriod(new Date("2027-02-28T23:59:00Z"))).toEqual({
      from: "2026-11-01",
      last: "2027-01-01",
      publishedOn: "2027-02-01",
    });
    expect(monthOf(new Date("2027-01-31T12:00:00Z"), -6)).toBe("2026-07-01");
  });
});

describe("percentages", () => {
  it("always adds up to 100", () => {
    // Plain rounding gives 29 + 42 + 17 + 8 + 4 = 100 here, but 33 × 3 = 99 below.
    expect(percentages([14, 20, 8, 4, 2])).toEqual([29, 42, 17, 8, 4]);
    expect(percentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(percentages([2, 2, 2, 1])).toEqual([29, 29, 28, 14]);
  });

  it("gives 0 everywhere when nothing was answered", () => {
    expect(percentages([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe("wilsonInterval", () => {
  const rounded = (positive: number, total: number) => {
    const { low, high } = wilsonInterval(positive, total);
    return [Math.round(low * 100), Math.round(high * 100)];
  };

  it("narrows as the answers grow", () => {
    expect(rounded(8, 10)).toEqual([49, 94]);
    expect(rounded(80, 100)).toEqual([71, 87]);
    expect(rounded(800, 1000)).toEqual([77, 82]);
  });

  it("stays between 0 and 1", () => {
    expect(rounded(10, 10)).toEqual([72, 100]);
    expect(rounded(0, 10)).toEqual([0, 28]);
    expect(wilsonInterval(0, 0)).toEqual({ low: 0, high: 1 });
  });
});

describe("topicHighlights", () => {
  // The mairie of the wireframe (2026-10-03): « Bien », « Pas bien ».
  const topic = (code: string, positive: number, negative: number) => ({ code, label: code, positive, negative });
  const mairie = [
    topic("STAFF", 21, 5), // 81 %, 62 % to 91 %
    topic("PROFESSIONALISM", 12, 4), // 75 %, but 51 % at worst
    topic("OPENING_HOURS", 11, 3), // 79 %, but 52 % at worst
    topic("WAIT_TIME", 6, 24), // 20 %, 37 % at best
    topic("PROCESSING_TIME", 5, 9), // 36 %, but 61 % at best
    topic("CLEANLINESS", 8, 10),
  ];

  it("keeps only the topics the margin confirms", () => {
    expect(topicHighlights(mairie)).toEqual({
      strengths: [{ code: "STAFF", label: "STAFF", total: 26, percent: 81 }],
      improvements: [{ code: "WAIT_TIME", label: "WAIT_TIME", total: 30, percent: 20 }],
    });
  });

  it("needs 10 ratings, keeps 2 per side, the most certain first", () => {
    expect(topicHighlights([topic("A", 9, 0)])).toEqual({ strengths: [], improvements: [] });
    const many = topicHighlights([topic("A", 40, 2), topic("B", 90, 1), topic("C", 30, 0), topic("D", 1, 40)]);
    expect(many.strengths.map((t) => t.code)).toEqual(["B", "C"]);
    expect(many.improvements.map((t) => t.code)).toEqual(["D"]);
  });
});
