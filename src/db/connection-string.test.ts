import { describe, expect, it } from "vitest";
import { withStrictSsl } from "./connection-string";

describe("withStrictSsl", () => {
  it("turns sslmode=require into verify-full and keeps other parameters", () => {
    const out = withStrictSsl(
      "postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    );
    const url = new URL(out);
    expect(url.searchParams.get("sslmode")).toBe("verify-full");
    expect(url.searchParams.get("channel_binding")).toBe("require");
    expect(url.password).toBe("p");
  });

  it("leaves URLs without sslmode untouched", () => {
    const local = "postgres://postgres@localhost/feedback";
    expect(withStrictSsl(local)).toBe(local);
  });

  it("respects an explicit libpq compatibility choice", () => {
    const url = "postgres://u@h/db?uselibpqcompat=true&sslmode=require";
    expect(new URL(withStrictSsl(url)).searchParams.get("sslmode")).toBe("require");
  });
});
