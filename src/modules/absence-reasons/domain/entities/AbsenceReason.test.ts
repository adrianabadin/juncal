import { describe, it, expect } from "vitest";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";

const build = (overrides: Partial<Parameters<typeof AbsenceReason.fromPersistence>[0]> = {}) =>
  AbsenceReason.fromPersistence({
    id: "ar1",
    name: "Congreso",
    isDefault: false,
    isActive: true,
    ...overrides,
  });

describe("AbsenceReason", () => {
  it("exposes its persisted properties", () => {
    const reason = build({ id: "ar9", name: "Curso" });
    expect(reason.id).toBe("ar9");
    expect(reason.name).toBe("Curso");
    expect(reason.isDefault).toBe(false);
    expect(reason.isActive).toBe(true);
  });

  it("renames and deactivates", () => {
    const reason = build({ name: "Curso" });
    reason.rename("Capacitación");
    reason.deactivate();
    expect(reason.name).toBe("Capacitación");
    expect(reason.isActive).toBe(false);
  });

  it("allows deletion of a custom reason but blocks a default one", () => {
    expect(build({ isDefault: false }).canDelete()).toBe(true);
    expect(build({ isDefault: true }).canDelete()).toBe(false);
  });
});
