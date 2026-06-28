import { describe, it, expect } from "vitest";
import {
  registerUserSchema,
  changeUserRoleSchema,
} from "@users/domain/schemas/user.schema";

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

describe("changeUserRoleSchema", () => {
  it("acepta el rol RRHH", () => {
    const r = changeUserRoleSchema.safeParse({
      userId: "u1",
      role: "RRHH",
    });
    expect(r.success).toBe(true);
  });

  it("acepta los roles existentes", () => {
    expect(
      changeUserRoleSchema.safeParse({ userId: "u1", role: "COORDINATOR" })
        .success,
    ).toBe(true);
    expect(
      changeUserRoleSchema.safeParse({ userId: "u1", role: "BASE_PROFESSIONAL" })
        .success,
    ).toBe(true);
  });

  it("rechaza un rol desconocido", () => {
    const r = changeUserRoleSchema.safeParse({
      userId: "u1",
      role: "ADMIN",
    });
    expect(r.success).toBe(false);
  });
});
