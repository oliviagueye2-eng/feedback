import { describe, expect, it } from "vitest";
import { isIndexableHost } from "./indexing";

describe("isIndexableHost", () => {
  it("lets search engines index neexnaxari.com", () => {
    expect(isIndexableHost("neexnaxari.com")).toBe(true);
    expect(isIndexableHost("www.neexnaxari.com")).toBe(true);
    expect(isIndexableHost("NeexNaxari.com:443")).toBe(true);
  });

  it("keeps the test address and anything else out of search results", () => {
    expect(isIndexableHost("feedback-pink-sigma.vercel.app")).toBe(false);
    expect(isIndexableHost("localhost:3000")).toBe(false);
    expect(isIndexableHost(null)).toBe(false);
  });
});
