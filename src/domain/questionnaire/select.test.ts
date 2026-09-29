import { describe, expect, it } from "vitest";
import { selectDetailedQuestionnaire } from "./select";

describe("selectDetailedQuestionnaire", () => {
  it("prefers the service's questionnaire", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: 3, sectorFallbackQuestionnaireId: 7 }),
    ).toEqual({ kind: "service", id: 3 });
  });

  it("falls back to the sector's questionnaire", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: null, sectorFallbackQuestionnaireId: 7 }),
    ).toEqual({ kind: "sector", id: 7 });
  });

  it("uses the generic questionnaire when nothing is known", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: null, sectorFallbackQuestionnaireId: null }),
    ).toEqual({ kind: "generic", code: "GENERIC" });
  });
});
