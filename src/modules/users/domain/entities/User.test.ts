import { describe, it, expect } from "vitest";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";

const base = {
  id: "u1", email: "doc@s.com", passwordHash: "h",
  name: "Doc", isActive: false, role: Role.BASE_PROFESSIONAL,
};

describe("User", () => {
  it("nace inactivo y se activa", () => {
    const u = User.fromPersistence(base);
    expect(u.isActive).toBe(false);
    u.activate();
    expect(u.isActive).toBe(true);
  });
  it("un usuario inactivo no puede actuar", () => {
    const u = User.fromPersistence(base);
    expect(u.canParticipate()).toBe(false);
  });
  it("un usuario activo puede actuar", () => {
    const u = User.fromPersistence({ ...base, isActive: true });
    expect(u.canParticipate()).toBe(true);
  });
});
