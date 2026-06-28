import { describe, it, expect } from "vitest";
import { buildConfirmedShiftsWorkbook } from "@shift-replacements/presentation/components/exportConfirmedShiftsWorkbook";

const specialtyNameById = new Map<string, string>([["s1", "Clínica Médica"]]);

const shifts = [
  {
    requesterStart: "2026-07-01T08:00:00.000Z",
    requesterEnd: "2026-07-01T20:00:00.000Z",
    specialtyId: "s1",
    requesterName: "Dra. Ruiz",
    moduleHours: 12,
    coverages: [
      {
        applicantName: "Dr. Paz",
        start: "2026-07-01T08:00:00.000Z",
        end: "2026-07-01T14:00:00.000Z",
      },
    ],
  },
];

describe("buildConfirmedShiftsWorkbook", () => {
  it("creates a worksheet titled with the Sanatorio Juncal brand", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos");
    expect(ws).toBeDefined();
    expect(ws!.getCell("A1").value).toContain("Sanatorio Juncal");
  });

  it("renders the date-range header with Desde/Hasta labels and both bounds", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const dateValue = String(ws.getCell("A4").value);
    // Behavioral, timezone-stable: header carries both range labels, the year,
    // and two distinct formatted dates (start before end).
    expect(dateValue).toContain("Desde:");
    expect(dateValue).toContain("Hasta:");
    expect(dateValue).toContain("2026");
    const dates = dateValue.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) ?? [];
    expect(dates).toHaveLength(2);
    expect(dates[0]).not.toBe(dates[1]);
  });

  it("writes the 7 column headers in order", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const headerRow = ws.getRow(6);
    expect(headerRow.getCell(1).value).toBe("Fecha");
    expect(headerRow.getCell(2).value).toBe("Especialidad");
    expect(headerRow.getCell(3).value).toBe("Solicitante");
    expect(headerRow.getCell(4).value).toBe("Entrada");
    expect(headerRow.getCell(5).value).toBe("Salida");
    expect(headerRow.getCell(6).value).toBe("Módulo");
    expect(headerRow.getCell(7).value).toBe("Coberturas");
  });

  it("maps each shift into a data row with resolved specialty name and coverages", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const dataRow = ws.getRow(7);
    expect(dataRow.getCell(2).value).toBe("Clínica Médica");
    expect(dataRow.getCell(3).value).toBe("Dra. Ruiz");
    expect(dataRow.getCell(6).value).toBe("12h");
    expect(String(dataRow.getCell(7).value)).toContain("Dr. Paz");
  });

  it("falls back to the specialty id when the name is unknown", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts: [{ ...shifts[0], specialtyId: "unknown" }],
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    expect(ws.getRow(7).getCell(2).value).toBe("unknown");
  });

  // 1x1 transparent PNG, base64-encoded.
  const PNG_1x1 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  it("embeds a logo image in the header when logoBase64 is provided", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
      logoBase64: PNG_1x1,
    });
    // ExcelJS registers added images on the workbook media list.
    expect(wb.model.media.length).toBeGreaterThan(0);
    expect(wb.model.media.some((m) => m.type === "image")).toBe(true);
  });

  it("embeds no image when logoBase64 is omitted", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    expect(wb.model.media.length).toBe(0);
  });
});
