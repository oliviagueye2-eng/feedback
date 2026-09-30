import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/feedbacks", () => ({
  upsertFeedback: vi.fn(),
  upsertAnswer: vi.fn(),
  replaceTopics: vi.fn(),
  upsertComment: vi.fn(),
  findQuestionnaireSources: vi.fn(),
}));

import * as db from "../../db/feedbacks";
import { DomainError } from "../errors";
import { saveTopics, upsertFeedback } from "./index";

const FEEDBACK_ID = "2f1c7a3e-8b4d-4c1a-9e2f-5a6b7c8d9e0f";
const ESTABLISHMENT_ID = "7d9e1f2a-3b4c-4d5e-8f6a-1b2c3d4e5f6a";

beforeEach(() => vi.clearAllMocks());

describe("upsertFeedback", () => {
  it("defaults to a visit today for QR code arrivals and rounds started_at to the hour", async () => {
    await upsertFeedback(
      FEEDBACK_ID,
      { channel: "qr", establishmentId: ESTABLISHMENT_ID, language: "fr" },
      new Date("2026-03-10T09:47:12Z"),
    );
    expect(db.upsertFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        visitPeriod: "today",
        visitMonth: "2026-03-01",
        startedAt: new Date("2026-03-10T09:00:00Z"),
      }),
    );
  });

  it("rejects an id that is not a UUID", async () => {
    await expect(
      upsertFeedback("abc", { channel: "qr", establishmentId: ESTABLISHMENT_ID, language: "fr" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(db.upsertFeedback).not.toHaveBeenCalled();
  });

  it("requires the visit period when the user did not scan a QR code", async () => {
    await expect(
      upsertFeedback(FEEDBACK_ID, { channel: "search", establishmentId: ESTABLISHMENT_ID, language: "fr" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(db.upsertFeedback).not.toHaveBeenCalled();
  });

  it("rejects an unknown visit period", async () => {
    await expect(
      upsertFeedback(FEEDBACK_ID, {
        channel: "search",
        establishmentId: ESTABLISHMENT_ID,
        language: "fr",
        visitPeriod: "yesterday",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});

describe("saveTopics", () => {
  it("keeps « Bien » or « Pas bien » for each topic, and a short text for OTHER", async () => {
    await saveTopics(FEEDBACK_ID, {
      topics: [
        { code: "STAFF", sentiment: "positive" },
        { code: "WAIT_TIME", sentiment: "negative" },
        { code: "OTHER", sentiment: "negative", otherText: "Parking" },
      ],
    });
    expect(db.replaceTopics).toHaveBeenCalledWith({
      feedbackId: FEEDBACK_ID,
      topics: [
        { code: "STAFF", sentiment: "positive", otherText: null },
        { code: "WAIT_TIME", sentiment: "negative", otherText: null },
        { code: "OTHER", sentiment: "negative", otherText: "Parking" },
      ],
    });
  });

  it("requires a known sentiment for each topic", async () => {
    await expect(saveTopics(FEEDBACK_ID, { topics: [{ code: "STAFF" }] })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(
      saveTopics(FEEDBACK_ID, { topics: [{ code: "STAFF", sentiment: "neutral" }] }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("refuses a text on another topic", async () => {
    await expect(
      saveTopics(FEEDBACK_ID, { topics: [{ code: "FEES", sentiment: "negative", otherText: "Trop cher" }] }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("limits the OTHER text to 50 characters", async () => {
    await expect(
      saveTopics(FEEDBACK_ID, { topics: [{ code: "OTHER", sentiment: "negative", otherText: "x".repeat(51) }] }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
