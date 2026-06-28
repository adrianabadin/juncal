import { describe, it, expect } from "vitest";
import { AbsenceReasonMapper } from "@absence-reasons/infrastructure/mappers/AbsenceReasonMapper";

describe("AbsenceReasonMapper", () => {
  it("maps a persistence row to a domain entity preserving its fields", () => {
    const reason = AbsenceReasonMapper.toDomain({
      id: "ar1",
      name: "Otros",
      isDefault: true,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    });

    expect(reason.id).toBe("ar1");
    expect(reason.name).toBe("Otros");
    expect(reason.isDefault).toBe(true);
    expect(reason.isActive).toBe(true);
  });

  it("maps a deactivated custom reason", () => {
    const reason = AbsenceReasonMapper.toDomain({
      id: "ar2",
      name: "Curso",
      isDefault: false,
      isActive: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    });

    expect(reason.isDefault).toBe(false);
    expect(reason.isActive).toBe(false);
    expect(reason.canDelete()).toBe(true);
  });
});
