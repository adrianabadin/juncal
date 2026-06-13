import { describe, it, expect } from "vitest";
import { registerUserSchema } from "@users/domain/schemas/user.schema";

describe("registerUserSchema", () => {
  it("acepta datos válidos", () => {
    const r = registerUserSchema.safeParse({
      email: "doc@s.com", password: "secret12", name: "Doc",
    });
    expect(r.success).toBe(true);
  });
  it("rechaza password corta", () => {
    const r = registerUserSchema.safeParse({
      email: "doc@s.com", password: "123", name: "Doc",
    });
    expect(r.success).toBe(false);
  });
});
