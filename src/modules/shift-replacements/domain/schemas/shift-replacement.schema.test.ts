import { describe, it, expect } from "vitest";
import {
  requestAbsenceSchema,
  createCompulsorySchema,
} from "@shift-replacements/domain/schemas/shift-replacement.schema";

const base = {
  specialtyId: "s1",
  moduleHours: 12,
  requesterStart: "2026-07-01T08:00",
  requesterEnd: "2026-07-01T20:00",
};

const compulsoryBase = {
  ...base,
  requesterId: "req",
  applicantId: "app",
  coverageStart: "2026-07-01T08:00",
  coverageEnd: "2026-07-01T14:00",
};

describe("requestAbsenceSchema — motivo", () => {
  it("requires absenceReasonId", () => {
    const r = requestAbsenceSchema.safeParse({ ...base });
    expect(r.success).toBe(false);
  });

  it("accepts a standard reason without observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-enfermedad",
      absenceReasonName: "Enfermedad",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.absenceReasonId).toBe("ar-enfermedad");
      expect(r.data.observation).toBeNull();
    }
  });

  it("rejects Otros without observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-otros",
      absenceReasonName: "Otros",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.includes("observation"));
      expect(issue?.message).toBe("Ingrese una observación");
    }
  });

  it("accepts Otros with observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-otros",
      absenceReasonName: "Otros",
      observation: "Trámite personal urgente",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBe("Trámite personal urgente");
  });

  it("rejects observation longer than 500 chars", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-otros",
      absenceReasonName: "Otros",
      observation: "x".repeat(501),
    });
    expect(r.success).toBe(false);
  });

  // NEW rule (spec): only exact "Otros" requires observation — non-Otros non-default passes
  it("accepts a non-default non-Otros reason without observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-cambio",
      absenceReasonName: "Cambio de guardia",
      isDefault: false,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBeNull();
  });

  it("accepts a non-default Otros reason with observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-otros",
      absenceReasonName: "Otros",
      isDefault: false,
      observation: "Trámite personal urgente",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBe("Trámite personal urgente");
  });

  it("accepts a default reason without observation", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-enfermedad",
      isDefault: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBeNull();
  });
});

describe("requestAbsenceSchema — bajoFactura", () => {
  it("defaults bajoFactura to false when omitted", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-enfermedad",
      isDefault: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bajoFactura).toBe(false);
  });

  it("preserves bajoFactura=true", () => {
    const r = requestAbsenceSchema.safeParse({
      ...base,
      absenceReasonId: "ar-enfermedad",
      isDefault: true,
      bajoFactura: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bajoFactura).toBe(true);
  });
});

describe("createCompulsorySchema — motivo", () => {
  it("requires absenceReasonId", () => {
    const r = createCompulsorySchema.safeParse({ ...compulsoryBase });
    expect(r.success).toBe(false);
  });

  it("accepts a standard reason without observation", () => {
    const r = createCompulsorySchema.safeParse({
      ...compulsoryBase,
      absenceReasonId: "ar-vacaciones",
      absenceReasonName: "Vacaciones",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBeNull();
  });

  it("rejects Otros without observation", () => {
    const r = createCompulsorySchema.safeParse({
      ...compulsoryBase,
      absenceReasonId: "ar-otros",
      absenceReasonName: "Otros",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.includes("observation"));
      expect(issue?.message).toBe("Ingrese una observación");
    }
  });

  // NEW rule (spec): only exact "Otros" requires observation — non-Otros non-default passes
  it("accepts a non-default non-Otros reason without observation", () => {
    const r = createCompulsorySchema.safeParse({
      ...compulsoryBase,
      absenceReasonId: "ar-cambio",
      absenceReasonName: "Cambio de guardia",
      isDefault: false,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.observation).toBeNull();
  });

  it("defaults bajoFactura to false when omitted", () => {
    const r = createCompulsorySchema.safeParse({
      ...compulsoryBase,
      absenceReasonId: "ar-vacaciones",
      isDefault: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bajoFactura).toBe(false);
  });

  it("preserves bajoFactura=true", () => {
    const r = createCompulsorySchema.safeParse({
      ...compulsoryBase,
      absenceReasonId: "ar-vacaciones",
      isDefault: true,
      bajoFactura: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bajoFactura).toBe(true);
  });
});
