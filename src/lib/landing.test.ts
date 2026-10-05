import { describe, expect, it } from "vitest";
import { routeRequest } from "./landing";

describe("routeRequest", () => {
  it("shows the landing page at the root of the main domain", () => {
    expect(routeRequest("neexnaxari.com", "/")).toBe("landing");
    expect(routeRequest("www.neexnaxari.com", "/")).toBe("landing");
    expect(routeRequest("NeexNaxari.com:443", "/")).toBe("landing");
  });

  it("sends every other page of the main domain to the landing page", () => {
    expect(routeRequest("neexnaxari.com", "/avis")).toBe("to-landing");
    expect(routeRequest("neexnaxari.com", "/donner/123")).toBe("to-landing");
    expect(routeRequest("neexnaxari.com", "/lancement")).toBe("to-landing");
  });

  it("keeps the whole site on the test address", () => {
    expect(routeRequest("feedback-pink-sigma.vercel.app", "/")).toBe("site");
    expect(routeRequest("feedback-pink-sigma.vercel.app", "/avis")).toBe("site");
    expect(routeRequest("localhost:3000", "/")).toBe("site");
    expect(routeRequest(null, "/")).toBe("site");
  });
});
