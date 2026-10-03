import { describe, expect, it } from "vitest";
import { monthOf, percentages, publicationPeriod } from "./results";

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
