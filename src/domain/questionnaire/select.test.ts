import { describe, expect, it } from "vitest";
import { selectQuestionSets } from "./select";

const none = { sectorKnown: true, sectorSetIds: [], typeSetIds: [], serviceSetIds: [], commerceSetId: 9 };

describe("selectQuestionSets", () => {
  it("adds up the sector's, the type's and the service's lists, from the most general", () => {
    expect(selectQuestionSets({ ...none, sectorSetIds: [1], typeSetIds: [2], serviceSetIds: [3] })).toEqual([1, 2, 3]);
  });

  it("adds a level's lists in their order (0044: several per level)", () => {
    expect(selectQuestionSets({ ...none, sectorSetIds: [1, 5], serviceSetIds: [3, 6] })).toEqual([1, 5, 3, 6]);
  });

  it("skips a level without a list (Transport: only the service's)", () => {
    expect(selectQuestionSets({ ...none, serviceSetIds: [3] })).toEqual([3]);
    expect(selectQuestionSets(none)).toEqual([]);
  });

  it("gives COMMERCE to an establishment whose sector is unknown", () => {
    expect(selectQuestionSets({ ...none, sectorKnown: false })).toEqual([9]);
  });

  it("never lists the same list twice", () => {
    expect(selectQuestionSets({ ...none, sectorSetIds: [4, 7], serviceSetIds: [7, 4] })).toEqual([4, 7]);
  });
});
