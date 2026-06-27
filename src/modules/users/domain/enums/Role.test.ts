import { describe, it, expect } from "vitest";
import { Role, isRole } from "@users/domain/enums/Role";

describe("Role enum", () => {
  it("exposes RRHH as a valid role value", () => {
    expect(Role.RRHH).toBe("RRHH");
  });

  it("isRole accepts RRHH", () => {
    expect(isRole("RRHH")).toBe(true);
  });

  it("isRole still accepts existing roles", () => {
    expect(isRole("BASE_PROFESSIONAL")).toBe(true);
    expect(isRole("COORDINATOR")).toBe(true);
  });

  it("isRole rejects unknown roles", () => {
    expect(isRole("ADMIN")).toBe(false);
    expect(isRole("")).toBe(false);
  });
});
