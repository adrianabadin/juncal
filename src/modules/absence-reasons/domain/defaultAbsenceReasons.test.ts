import { describe, it, expect } from "vitest";
import { defaultAbsenceReasons } from "@absence-reasons/domain/defaultAbsenceReasons";

describe("defaultAbsenceReasons", () => {
  it("defines exactly the 4 seeded default reasons", () => {
    const names = defaultAbsenceReasons.map((r) => r.name);
    expect(names).toEqual([
      "Motivos Personales",
      "Vacaciones",
      "Cambio de guardia",
      "Congresos",
    ]);
  });

  it("marks every default reason as isDefault and isActive", () => {
    expect(defaultAbsenceReasons).toHaveLength(4);
    for (const reason of defaultAbsenceReasons) {
      expect(reason.isDefault).toBe(true);
      expect(reason.isActive).toBe(true);
    }
  });
});
