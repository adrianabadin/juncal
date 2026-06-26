import { describe, it, expect } from "vitest";
import {
  isCustomReason,
  resolveAbsenceReasonName,
  displayAbsenceReason,
  visibleAbsenceReasons,
  absenceFormDefaults,
  type AbsenceReasonOption,
} from "@shift-replacements/presentation/components/absenceMotivoForm";

const reasons: AbsenceReasonOption[] = [
  { id: "ar1", name: "Vacaciones", isDefault: true, isActive: true },
  { id: "ar2", name: "Curso", isDefault: false, isActive: true },
  { id: "ar3", name: "Motivos Personales", isDefault: true, isActive: true },
];

describe("resolveAbsenceReasonName", () => {
  it("maps a selected id to its reason name", () => {
    expect(resolveAbsenceReasonName(reasons, "ar1")).toBe("Vacaciones");
    expect(resolveAbsenceReasonName(reasons, "ar2")).toBe("Curso");
  });

  it("returns undefined when no id is selected or id is unknown", () => {
    expect(resolveAbsenceReasonName(reasons, "")).toBeUndefined();
    expect(resolveAbsenceReasonName(reasons, "missing")).toBeUndefined();
  });
});

describe("isCustomReason", () => {
  it("is true when the selected reason is not a protected default", () => {
    expect(isCustomReason("Curso", reasons)).toBe(true);
  });

  it("is false for protected default reasons", () => {
    expect(isCustomReason("Vacaciones", reasons)).toBe(false);
    expect(isCustomReason("Motivos Personales", reasons)).toBe(false);
  });

  it("is false when no reason is selected or the name is unknown", () => {
    expect(isCustomReason(undefined, reasons)).toBe(false);
    expect(isCustomReason("Inexistente", reasons)).toBe(false);
  });
});

describe("displayAbsenceReason", () => {
  it("shows 'Sin motivo' for legacy records with no reason", () => {
    expect(displayAbsenceReason(null)).toBe("Sin motivo");
    expect(displayAbsenceReason(undefined)).toBe("Sin motivo");
  });

  it("shows the reason name when present", () => {
    expect(displayAbsenceReason("Vacaciones")).toBe("Vacaciones");
    expect(displayAbsenceReason("Curso")).toBe("Curso");
  });
});

// S2 — deactivated reasons must NOT appear as selectable dropdown options for
// new absence requests (spec AR-6: deactivate Enfermedad/Otros).
describe("visibleAbsenceReasons", () => {
  it("excludes deactivated reasons from the dropdown options", () => {
    const withInactive: AbsenceReasonOption[] = [
      { id: "ar1", name: "Vacaciones", isDefault: true, isActive: true },
      { id: "ar2", name: "Enfermedad", isDefault: true, isActive: false },
      { id: "ar3", name: "Otros", isDefault: false, isActive: false },
      { id: "ar4", name: "Curso", isDefault: false, isActive: true },
    ];

    const visible = visibleAbsenceReasons(withInactive);

    expect(visible.map((r) => r.name)).toEqual(["Vacaciones", "Curso"]);
    expect(visible.some((r) => r.name === "Enfermedad")).toBe(false);
    expect(visible.some((r) => r.name === "Otros")).toBe(false);
  });

  it("keeps every reason when all are active", () => {
    expect(visibleAbsenceReasons(reasons)).toHaveLength(reasons.length);
  });
});

// S3 — the "Bajo factura" checkbox must render unchecked by default in both the
// absence-request form and the compulsory-assignment form (spec SR-7). Both
// forms seed react-hook-form from this shared defaults object, so asserting it
// here locks the default-unchecked behavior for every form that consumes it.
describe("absenceFormDefaults (bajo factura checkbox default)", () => {
  it("defaults bajoFactura to false (unchecked)", () => {
    expect(absenceFormDefaults.bajoFactura).toBe(false);
  });
});
