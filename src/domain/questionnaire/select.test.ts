import { describe, expect, it } from "vitest";
import { selectDetailedQuestionnaire } from "./select";

describe("selectDetailedQuestionnaire", () => {
  it("prefers the service's questionnaire", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: 3, typeQuestionnaireId: 5, sectorFallbackQuestionnaireId: 7 }),
    ).toEqual({ kind: "service", id: 3 });
  });

  it("then the establishment type's (an airport is not asked the bus questions of its sector)", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: null, typeQuestionnaireId: 5, sectorFallbackQuestionnaireId: 7 }),
    ).toEqual({ kind: "type", id: 5 });
  });

  it("falls back to the sector's questionnaire", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: null, typeQuestionnaireId: null, sectorFallbackQuestionnaireId: 7 }),
    ).toEqual({ kind: "sector", id: 7 });
  });

  it("uses the generic questionnaire when nothing is known", () => {
    expect(
      selectDetailedQuestionnaire({ serviceQuestionnaireId: null, typeQuestionnaireId: null, sectorFallbackQuestionnaireId: null }),
    ).toEqual({ kind: "generic", code: "GENERIC" });
  });
});
