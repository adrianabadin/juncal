/**
 * Pure KPI computation for the RRHH dashboard.
 *
 * All metrics derive from the same filtered confirmed replacements shown in the
 * worklist/export, so the dashboard stays internally consistent. Kept pure (no
 * React, no I/O) so it is unit-testable without a DOM.
 */

export const APPROVAL_RATE_LABEL = "solicitudes aprobadas sobre registradas";

const EMPTY = "—";
const MS_PER_HOUR = 1000 * 60 * 60;

export interface MetricsCoverage {
  start: string;
  end: string;
}

export interface MetricsShift {
  specialtyId: string;
  moduleHours: number;
  bajoFactura: boolean;
  absenceReasonId: string | null;
  coverages: MetricsCoverage[];
}

export interface RrhhMetricsContext {
  specialtyNameById: Map<string, string>;
  reasonNameById: Map<string, string>;
  /** Total registered (requested) replacements for the same filter window. */
  totalRegistered: number;
}

export interface RrhhMetrics {
  totalApproved: number;
  approvalRate: {
    label: string;
    value: number;
    approved: number;
    registered: number;
  };
  mostFrequentReason: string;
  highestDemandSpecialty: string;
  invoiceDistribution: { bajoFactura: number; regular: number };
  coveredHours: number;
  avgHoursPerReplacement: number;
}

function topByCount(
  ids: (string | null)[],
  nameById: Map<string, string>,
): string {
  const counts = new Map<string, number>();
  for (const id of ids) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let bestId: string | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  }
  if (!bestId) return EMPTY;
  return nameById.get(bestId) ?? bestId;
}

function coverageHours(coverages: MetricsCoverage[]): number {
  return coverages.reduce((sum, c) => {
    const ms = new Date(c.end).getTime() - new Date(c.start).getTime();
    return sum + (ms > 0 ? ms / MS_PER_HOUR : 0);
  }, 0);
}

export function computeRrhhMetrics(
  shifts: MetricsShift[],
  ctx: RrhhMetricsContext,
): RrhhMetrics {
  const totalApproved = shifts.length;

  const approvalValue =
    ctx.totalRegistered > 0 ? totalApproved / ctx.totalRegistered : 0;

  const bajoFacturaCount = shifts.filter((s) => s.bajoFactura).length;

  const coveredHours = shifts.reduce(
    (sum, s) => sum + coverageHours(s.coverages),
    0,
  );

  const totalModuleHours = shifts.reduce((sum, s) => sum + s.moduleHours, 0);
  const avgHoursPerReplacement =
    totalApproved > 0 ? totalModuleHours / totalApproved : 0;

  return {
    totalApproved,
    approvalRate: {
      label: APPROVAL_RATE_LABEL,
      value: approvalValue,
      approved: totalApproved,
      registered: ctx.totalRegistered,
    },
    mostFrequentReason: topByCount(
      shifts.map((s) => s.absenceReasonId),
      ctx.reasonNameById,
    ),
    highestDemandSpecialty: topByCount(
      shifts.map((s) => s.specialtyId),
      ctx.specialtyNameById,
    ),
    invoiceDistribution: {
      bajoFactura: bajoFacturaCount,
      regular: totalApproved - bajoFacturaCount,
    },
    coveredHours,
    avgHoursPerReplacement,
  };
}
