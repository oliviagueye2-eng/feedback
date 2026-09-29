import { describe, expect, it } from "vitest";
import { isAuthorizedCronCall } from "./cron";

describe("isAuthorizedCronCall", () => {
  it("accepts the configured secret", () => {
    expect(isAuthorizedCronCall("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("refuses a wrong or missing header", () => {
    expect(isAuthorizedCronCall("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedCronCall(null, "s3cret")).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(isAuthorizedCronCall("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCronCall("Bearer ", "")).toBe(false);
  });
});
