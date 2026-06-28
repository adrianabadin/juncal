/**
 * Pure filtering logic for the RRHH confirmed-replacements view.
 *
 * Extracted as a pure function (no Prisma, no session) so it can be unit-tested
 * without mocks and reused by the RRHH server action.
 */

export interface RrhhReplacementFilters {
  specialtyId?: string;
  bajoFactura?: boolean;
  start: string;
  end: string;
}

export interface FilterableShift {
  specialtyId: string;
  bajoFactura: boolean;
  requesterStart: Date;
}

/** End of the given calendar day in the same instant basis as the input. */
function endOfDay(iso: string): number {
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function filterConfirmedShiftsForRRHH<T extends FilterableShift>(
  shifts: T[],
  filters: RrhhReplacementFilters,
): T[] {
  const startMs = new Date(filters.start).getTime();
  const endMs = endOfDay(filters.end);

  return shifts.filter((s) => {
    const startInstant = s.requesterStart.getTime();
    if (startInstant < startMs || startInstant > endMs) return false;
    if (filters.specialtyId && s.specialtyId !== filters.specialtyId) {
      return false;
    }
    if (
      filters.bajoFactura !== undefined &&
      s.bajoFactura !== filters.bajoFactura
    ) {
      return false;
    }
    return true;
  });
}
