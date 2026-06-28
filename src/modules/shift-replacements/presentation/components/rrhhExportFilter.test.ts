import { describe, it, expect } from "vitest";
import { filterConfirmedShiftsForRRHH } from "@shift-replacements/presentation/actions/rrhhShiftFilters";
import { buildConfirmedShiftsWorkbook } from "@shift-replacements/presentation/components/exportConfirmedShiftsWorkbook";

/**
 * Integration: the RRHH Excel export is built from the SAME filtered subset the
 * dashboard shows (filter -> workbook). Applying a specialty filter must
 * produce a workbook containing only the matching rows.
 */

const specialtyNameById = new Map([
  ["s1", "Clínica Médica"],
  ["s2", "Pediatría"],
]);

// Repo-shaped rows (Date instants) are what the filter operates on, before
// mapping to the string-based export DTO.
function row(id: string, specialtyId: string, requesterName: string) {
  return {
    id,
    specialtyId,
    bajoFactura: false,
    requesterName,
    moduleHours: 12,
    requesterStart: new Date("2026-07-10T08:00:00.000Z"),
    requesterEnd: new Date("2026-07-10T20:00:00.000Z"),
    coverages: [] as { applicantName?: string; start: string; end: string }[],
  };
}

type RepoRow = ReturnType<typeof row>;

/** Mirrors the action's DTO mapping: Date instants -> ISO strings. */
function toExportShift(r: RepoRow) {
  return {
    specialtyId: r.specialtyId,
    requesterName: r.requesterName,
    moduleHours: r.moduleHours,
    requesterStart: r.requesterStart.toISOString(),
    requesterEnd: r.requesterEnd.toISOString(),
    coverages: r.coverages,
  };
}

const dataset = [
  row("a", "s1", "Dra. Ruiz"),
  row("b", "s2", "Dr. Paz"),
  row("c", "s1", "Dra. Lopez"),
];

function dataRowValues(ws: import("exceljs").Worksheet, column: number): string[] {
  const values: string[] = [];
  // Data rows start at row 7 in the shared workbook layout.
  let r = 7;
  while (ws.getRow(r).getCell(3).value != null) {
    values.push(String(ws.getRow(r).getCell(column).value));
    r++;
  }
  return values;
}

describe("RRHH export respects active filters", () => {
  it("includes only rows matching the specialty filter", () => {
    const filters = { start: "2026-07-01", end: "2026-07-31", specialtyId: "s1" };
    const filtered = filterConfirmedShiftsForRRHH(dataset, filters);

    const wb = buildConfirmedShiftsWorkbook({
      shifts: filtered.map(toExportShift),
      specialtyNameById,
      start: filters.start,
      end: filters.end,
    });
    const ws = wb.getWorksheet("Reemplazos")!;

    const requesters = dataRowValues(ws, 3); // "Solicitante" column
    expect(requesters).toEqual(["Dra. Ruiz", "Dra. Lopez"]);
    expect(requesters).not.toContain("Dr. Paz");
  });

  it("exports all rows when no specialty filter is applied", () => {
    const filters = { start: "2026-07-01", end: "2026-07-31" };
    const filtered = filterConfirmedShiftsForRRHH(dataset, filters);

    const wb = buildConfirmedShiftsWorkbook({
      shifts: filtered.map(toExportShift),
      specialtyNameById,
      start: filters.start,
      end: filters.end,
    });
    const ws = wb.getWorksheet("Reemplazos")!;

    expect(dataRowValues(ws, 3)).toHaveLength(3);
  });
});
