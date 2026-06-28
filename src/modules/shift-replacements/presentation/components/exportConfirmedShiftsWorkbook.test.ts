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

  it("writes the 9 column headers in order", () => {
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
    expect(headerRow.getCell(8).value).toBe("Motivo");
    expect(headerRow.getCell(9).value).toBe("Observación");
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

  it("writes Motivo and Observación columns from shift data", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts: [
        {
          ...shifts[0],
          reasonName: "Otros",
          observation: "Trámite personal urgente",
        },
      ],
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const dataRow = ws.getRow(7);
    expect(dataRow.getCell(8).value).toBe("Otros");
    expect(dataRow.getCell(9).value).toBe("Trámite personal urgente");
  });

  it("renders Observación as em-dash for non-Otros motives", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts: [
        {
          ...shifts[0],
          reasonName: "Cambio de guardia",
          observation: null,
        },
      ],
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const dataRow = ws.getRow(7);
    expect(dataRow.getCell(8).value).toBe("Cambio de guardia");
    expect(dataRow.getCell(9).value).toBe("—");
  });

  it("renders Observación as em-dash when reasonName is missing", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts: [{ ...shifts[0] }],
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const dataRow = ws.getRow(7);
    expect(dataRow.getCell(8).value).toBe("—");
    expect(dataRow.getCell(9).value).toBe("—");
  });

  it("spans the title, subtitle, and date-range headers across all 9 columns (A1:I1, A3:I3, A4:I4)", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    // Merge ranges are exposed on the worksheet model as a list of strings.
    // After the update, every banner row should reach column I (the new
    // Observación column).
    const merges = (ws.model.merges ?? []) as string[];
    const mergeAddresses = merges.map((m) => String(m));
    expect(mergeAddresses).toContain("A1:I1");
    expect(mergeAddresses).toContain("A3:I3");
    expect(mergeAddresses).toContain("A4:I4");
    // Old A1:G1 banner merge must be gone.
    expect(mergeAddresses).not.toContain("A1:G1");
    expect(mergeAddresses).not.toContain("A3:G3");
    expect(mergeAddresses).not.toContain("A4:G4");
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
