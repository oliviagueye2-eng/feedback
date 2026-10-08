import { describe, expect, it } from "vitest";
import { selectQuestionSets } from "./select";

const none = { sectorKnown: true, sectorSetId: null, typeSetId: null, serviceSetId: null, commerceSetId: 9 };

describe("selectQuestionSets", () => {
  it("adds up the sector's, the type's and the service's lists, from the most general", () => {
    expect(selectQuestionSets({ ...none, sectorSetId: 1, typeSetId: 2, serviceSetId: 3 })).toEqual([1, 2, 3]);
  });

  it("skips a level without a list (Transport: only the service's)", () => {
    expect(selectQuestionSets({ ...none, serviceSetId: 3 })).toEqual([3]);
    expect(selectQuestionSets(none)).toEqual([]);
  });

  it("gives COMMERCE to an establishment whose sector is unknown", () => {
    expect(selectQuestionSets({ ...none, sectorKnown: false })).toEqual([9]);
  });

  it("never lists the same list twice", () => {
    expect(selectQuestionSets({ ...none, sectorSetId: 4, serviceSetId: 4 })).toEqual([4]);
  });
});
