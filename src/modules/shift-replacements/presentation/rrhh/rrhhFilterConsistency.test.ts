import { describe, it, expect } from "vitest";
import { filterConfirmedShiftsForRRHH } from "@shift-replacements/presentation/actions/rrhhShiftFilters";
import { computeRrhhMetrics } from "@shift-replacements/presentation/rrhh/rrhhMetrics";

/**
 * Integration: the dashboard derives BOTH the worklist and the KPIs from the
 * same filtered subset (filter -> {worklist, metrics}). This test proves that
 * applying a specialty filter narrows the worklist AND recomputes the KPIs
 * consistently — they never disagree.
 */

interface Row {
  id: string;
  specialtyId: string;
  bajoFactura: boolean;
  moduleHours: number;
  absenceReasonId: string | null;
  requesterStart: Date;
  coverages: { start: string; end: string }[];
}

function row(overrides: Partial<Row>): Row {
  return {
    id: "r",
    specialtyId: "s1",
    bajoFactura: false,
    moduleHours: 12,
    absenceReasonId: "enfermedad",
    requesterStart: new Date("2026-07-10T08:00:00.000Z"),
    coverages: [
      { start: "2026-07-10T08:00:00.000Z", end: "2026-07-10T14:00:00.000Z" }, // 6h
    ],
    ...overrides,
  };
}

const specialtyNameById = new Map([
  ["s1", "Clínica Médica"],
  ["s2", "Pediatría"],
]);
const reasonNameById = new Map([["enfermedad", "Enfermedad"]]);

const dataset: Row[] = [
  row({ id: "a", specialtyId: "s1", moduleHours: 12 }),
  row({ id: "b", specialtyId: "s1", moduleHours: 8 }),
  row({ id: "c", specialtyId: "s2", moduleHours: 6 }),
];

const baseFilters = { start: "2026-07-01", end: "2026-07-31" };

describe("RRHH filter → worklist + KPI consistency", () => {
  it("specialty filter narrows the worklist and KPIs to the same subset", () => {
    const filtered = filterConfirmedShiftsForRRHH(dataset, {
      ...baseFilters,
      specialtyId: "s1",
    });

    // Worklist side: only the two s1 rows survive.
    expect(filtered.map((s) => s.id)).toEqual(["a", "b"]);

    // KPI side: computed from the SAME filtered subset.
    const metrics = computeRrhhMetrics(filtered, {
      specialtyNameById,
      reasonNameById,
      totalRegistered: 3,
    });

    expect(metrics.totalApproved).toBe(filtered.length);
    expect(metrics.totalApproved).toBe(2);
    expect(metrics.highestDemandSpecialty).toBe("Clínica Médica");
    // avg module hours over the filtered subset only: (12 + 8) / 2 = 10
    expect(metrics.avgHoursPerReplacement).toBeCloseTo(10);
    // covered hours: 6h per row × 2 filtered rows = 12
    expect(metrics.coveredHours).toBeCloseTo(12);
  });

  it("a different specialty filter yields a different, still-consistent subset", () => {
    const filtered = filterConfirmedShiftsForRRHH(dataset, {
      ...baseFilters,
      specialtyId: "s2",
    });

    expect(filtered.map((s) => s.id)).toEqual(["c"]);

    const metrics = computeRrhhMetrics(filtered, {
      specialtyNameById,
      reasonNameById,
      totalRegistered: 3,
    });

    expect(metrics.totalApproved).toBe(1);
    expect(metrics.highestDemandSpecialty).toBe("Pediatría");
    expect(metrics.avgHoursPerReplacement).toBeCloseTo(6);
  });
});
