import { describe, expect, it } from "vitest";
import { computeVisitMonth, defaultVisitPeriod } from "./visit";

describe("computeVisitMonth", () => {
  const march10 = new Date("2026-03-10T09:30:00Z");

  it("counts recent visits in the month the feedback was given", () => {
    expect(computeVisitMonth("today", march10)).toBe("2026-03-01");
    expect(computeVisitMonth("under_week", march10)).toBe("2026-03-01");
    expect(computeVisitMonth("under_month", march10)).toBe("2026-03-01");
  });

  it("returns null for visits more than a month ago", () => {
    expect(computeVisitMonth("over_month", march10)).toBeNull();
  });

  it("uses UTC for the month boundary", () => {
    expect(computeVisitMonth("today", new Date("2026-03-31T23:30:00Z"))).toBe("2026-03-01");
  });
});

describe("defaultVisitPeriod", () => {
  it("assumes today for a QR code arrival", () => {
    expect(defaultVisitPeriod("qr")).toBe("today");
  });

  it("asks the user otherwise", () => {
    expect(defaultVisitPeriod("search")).toBeNull();
    expect(defaultVisitPeriod("link")).toBeNull();
  });
});
