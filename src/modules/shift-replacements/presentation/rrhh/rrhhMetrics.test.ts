import { describe, it, expect } from "vitest";
import {
  computeRrhhMetrics,
  APPROVAL_RATE_LABEL,
  type MetricsShift,
} from "@shift-replacements/presentation/rrhh/rrhhMetrics";

function mShift(overrides: Partial<MetricsShift> = {}): MetricsShift {
  return {
    specialtyId: "s1",
    moduleHours: 12,
    bajoFactura: false,
    absenceReasonId: "enfermedad",
    coverages: [
      {
        start: "2026-07-01T08:00:00.000Z",
        end: "2026-07-01T14:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

const specialtyNameById = new Map<string, string>([
  ["s1", "Clínica Médica"],
  ["s2", "Pediatría"],
]);
const reasonNameById = new Map<string, string>([
  ["enfermedad", "Enfermedad"],
  ["vacaciones", "Vacaciones"],
]);

describe("computeRrhhMetrics", () => {
  it("exposes the exact approval-rate label required by spec", () => {
    expect(APPROVAL_RATE_LABEL).toBe("solicitudes aprobadas sobre registradas");
  });

  it("counts total approved replacements", () => {
    const metrics = computeRrhhMetrics(
      [mShift(), mShift(), mShift()],
      { specialtyNameById, reasonNameById, totalRegistered: 5 },
    );
    expect(metrics.totalApproved).toBe(3);
  });

  it("computes approval rate as approved over registered, with the spec label", () => {
    const metrics = computeRrhhMetrics(
      [mShift(), mShift(), mShift()],
      { specialtyNameById, reasonNameById, totalRegistered: 4 },
    );
    expect(metrics.approvalRate.label).toBe(
      "solicitudes aprobadas sobre registradas",
    );
    expect(metrics.approvalRate.value).toBeCloseTo(0.75);
    expect(metrics.approvalRate.approved).toBe(3);
    expect(metrics.approvalRate.registered).toBe(4);
  });

  it("reports approval rate of 0 when nothing was registered (no divide-by-zero)", () => {
    const metrics = computeRrhhMetrics([], {
      specialtyNameById,
      reasonNameById,
      totalRegistered: 0,
    });
    expect(metrics.approvalRate.value).toBe(0);
    expect(metrics.totalApproved).toBe(0);
  });

  it("identifies the most frequent absence reason by resolved name", () => {
    const metrics = computeRrhhMetrics(
      [
        mShift({ absenceReasonId: "enfermedad" }),
        mShift({ absenceReasonId: "enfermedad" }),
        mShift({ absenceReasonId: "vacaciones" }),
      ],
      { specialtyNameById, reasonNameById, totalRegistered: 3 },
    );
    expect(metrics.mostFrequentReason).toBe("Enfermedad");
  });

  it("identifies the highest-demand specialty by resolved name", () => {
    const metrics = computeRrhhMetrics(
      [
        mShift({ specialtyId: "s2" }),
        mShift({ specialtyId: "s2" }),
        mShift({ specialtyId: "s1" }),
      ],
      { specialtyNameById, reasonNameById, totalRegistered: 3 },
    );
    expect(metrics.highestDemandSpecialty).toBe("Pediatría");
  });

  it("computes the invoice (bajoFactura) distribution", () => {
    const metrics = computeRrhhMetrics(
      [
        mShift({ bajoFactura: true }),
        mShift({ bajoFactura: true }),
        mShift({ bajoFactura: false }),
      ],
      { specialtyNameById, reasonNameById, totalRegistered: 3 },
    );
    expect(metrics.invoiceDistribution.bajoFactura).toBe(2);
    expect(metrics.invoiceDistribution.regular).toBe(1);
  });

  it("sums covered hours across all coverages", () => {
    const metrics = computeRrhhMetrics(
      [
        mShift({
          coverages: [
            { start: "2026-07-01T08:00:00.000Z", end: "2026-07-01T14:00:00.000Z" }, // 6h
            { start: "2026-07-01T14:00:00.000Z", end: "2026-07-01T20:00:00.000Z" }, // 6h
          ],
        }),
        mShift({
          coverages: [
            { start: "2026-07-02T08:00:00.000Z", end: "2026-07-02T12:00:00.000Z" }, // 4h
          ],
        }),
      ],
      { specialtyNameById, reasonNameById, totalRegistered: 2 },
    );
    expect(metrics.coveredHours).toBeCloseTo(16);
  });

  it("computes average module hours per replacement", () => {
    const metrics = computeRrhhMetrics(
      [mShift({ moduleHours: 12 }), mShift({ moduleHours: 6 })],
      { specialtyNameById, reasonNameById, totalRegistered: 2 },
    );
    expect(metrics.avgHoursPerReplacement).toBeCloseTo(9);
  });

  it("returns safe defaults for an empty data set", () => {
    const metrics = computeRrhhMetrics([], {
      specialtyNameById,
      reasonNameById,
      totalRegistered: 0,
    });
    expect(metrics.totalApproved).toBe(0);
    expect(metrics.coveredHours).toBe(0);
    expect(metrics.avgHoursPerReplacement).toBe(0);
    expect(metrics.mostFrequentReason).toBe("—");
    expect(metrics.highestDemandSpecialty).toBe("—");
    expect(metrics.invoiceDistribution.bajoFactura).toBe(0);
    expect(metrics.invoiceDistribution.regular).toBe(0);
  });
});
