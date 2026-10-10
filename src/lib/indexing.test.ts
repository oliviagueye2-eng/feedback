import { describe, expect, it } from "vitest";
import { isIndexableHost } from "./indexing";

describe("isIndexableHost", () => {
  it("lets search engines index neexnaqari.com", () => {
    expect(isIndexableHost("neexnaqari.com")).toBe(true);
    expect(isIndexableHost("www.neexnaqari.com")).toBe(true);
    expect(isIndexableHost("NeexNaqari.com:443")).toBe(true);
  });

  it("keeps the test address and anything else out of search results", () => {
    expect(isIndexableHost("feedback-pink-sigma.vercel.app")).toBe(false);
    expect(isIndexableHost("localhost:3000")).toBe(false);
    expect(isIndexableHost(null)).toBe(false);
  });
});
