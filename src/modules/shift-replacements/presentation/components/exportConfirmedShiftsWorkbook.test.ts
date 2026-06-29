import { describe, it, expect } from "vitest";
import {
  buildConfirmedShiftsWorkbook,
  computeBannerLayout,
  parsePngDimensions,
} from "@shift-replacements/presentation/components/exportConfirmedShiftsWorkbook";

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
    // Title now lives on row 2 (row 1 is the full-width logo banner).
    expect(ws!.getCell("A2").value).toContain("Sanatorio Juncal");
  });

  it("renders the date-range header with Desde/Hasta labels and both bounds", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    // Date-range row moved down to row 5 (below banner + title + subtitle).
    const dateValue = String(ws.getCell("A5").value);
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
    // Header row moved down to row 7 (banner row 1, title 2, subtitle 4, date 5).
    const headerRow = ws.getRow(7);
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
    // Data rows now start at row 8 (header is row 7).
    const dataRow = ws.getRow(8);
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
    expect(ws.getRow(8).getCell(2).value).toBe("unknown");
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
    const dataRow = ws.getRow(8);
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
    const dataRow = ws.getRow(8);
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
    const dataRow = ws.getRow(8);
    expect(dataRow.getCell(8).value).toBe("—");
    expect(dataRow.getCell(9).value).toBe("—");
  });

  it("spans the title, subtitle, and date-range headers across all 9 columns (A2:I2, A4:I4, A5:I5)", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    // Merge ranges are exposed on the worksheet model as a list of strings.
    // After the banner update, the title/subtitle/date rows moved down to make
    // room for the full-width logo banner on row 1, and every banner row should
    // reach column I (the Observación column).
    const merges = (ws.model.merges ?? []) as string[];
    const mergeAddresses = merges.map((m) => String(m));
    expect(mergeAddresses).toContain("A2:I2");
    expect(mergeAddresses).toContain("A4:I4");
    expect(mergeAddresses).toContain("A5:I5");
    // Old top-anchored title merge must be gone (banner is now on row 1).
    expect(mergeAddresses).not.toContain("A1:I1");
    expect(mergeAddresses).not.toContain("A1:G1");
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

  // 960x160 PNG header (6:1 aspect ratio — the real Sanatorio Juncal logo).
  // IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
  const PNG_960x160_BASE64 = (() => {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const ihdrLen = [0, 0, 0, 0x0d];
    const ihdrType = [0x49, 0x48, 0x44, 0x52]; // "IHDR"
    const width = [0, 0, 0x03, 0xc0]; // 960
    const height = [0, 0, 0, 0xa0]; // 160
    const rest = [0x08, 0x06, 0, 0, 0]; // bit depth, color type, etc.
    return Buffer.from([
      ...sig,
      ...ihdrLen,
      ...ihdrType,
      ...width,
      ...height,
      ...rest,
    ]).toString("base64");
  })();

  it("parses real width/height from a PNG IHDR header", () => {
    const dims = parsePngDimensions(PNG_960x160_BASE64);
    expect(dims).toEqual({ width: 960, height: 160 });
  });

  it("parses different dimensions from a different PNG (triangulation)", () => {
    // 1x1 transparent PNG → 1x1.
    const dims = parsePngDimensions(PNG_1x1);
    expect(dims).toEqual({ width: 1, height: 1 });
  });

  it("embeds the logo as a full-width banner preserving the source aspect ratio", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
      logoBase64: PNG_960x160_BASE64,
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const imageIds = ws.getImages();
    expect(imageIds).toHaveLength(1);
    const placed = imageIds[0];
    // Anchored at the top-left of the sheet (col 0, row 0).
    expect(placed.range.tl.nativeCol).toBe(0);
    expect(placed.range.tl.nativeRow).toBe(0);
    // The embedded image preserves the 6:1 source ratio (within rounding).
    // ExcelJS stores ext on the model at runtime even though ImageRange types
    // only expose tl/br. We cast through unknown to read the actual dimensions.
    const ext = (placed.range as unknown as { ext: { width: number; height: number } }).ext;
    const ratio = ext.width / ext.height;
    expect(ratio).toBeGreaterThan(5.9);
    expect(ratio).toBeLessThan(6.1);
  });

  it("stretches the banner to the full sheet width (sum of column widths × conversion)", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
      logoBase64: PNG_960x160_BASE64,
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const placed = ws.getImages()[0];
    const ext = (placed.range as unknown as { ext: { width: number; height: number } }).ext;
    // Column widths [14,20,24,10,10,10,55,22,40] sum to 205; at 7 px/char that
    // is 1435 px of usable width. The banner must span (approximately) that.
    expect(ext.width).toBeGreaterThanOrEqual(1400);
    expect(ext.width).toBeLessThanOrEqual(1470);
  });

  it("gives the banner row enough height to clear the title (no overlap)", () => {
    const wb = buildConfirmedShiftsWorkbook({
      shifts,
      specialtyNameById,
      start: "2026-07-01",
      end: "2026-07-31",
      logoBase64: PNG_960x160_BASE64,
    });
    const ws = wb.getWorksheet("Reemplazos")!;
    const placed = ws.getImages()[0];
    const ext = (placed.range as unknown as { ext: { width: number; height: number } }).ext;
    // Banner row height (points) must cover the banner image height (pixels).
    // px → pt ≈ px * 0.75. The reserved row 1 height must be at least that.
    const bannerHeightPt = ext.height * 0.75;
    expect(ws.getRow(1).height).toBeGreaterThanOrEqual(bannerHeightPt - 1);
    // And the title (row 2) sits strictly below the banner row.
    expect(String(ws.getCell("A2").value)).toContain("Sanatorio Juncal");
  });
});

describe("computeBannerLayout", () => {
  const columnWidths = [14, 20, 24, 10, 10, 10, 55, 22, 40]; // sum = 205

  it("stretches the banner to full width and preserves aspect ratio (6:1)", () => {
    const layout = computeBannerLayout(columnWidths, 960, 160);
    // 205 chars * 7 px/char = 1435 px.
    expect(layout.bannerWidthPx).toBe(1435);
    // 1435 / (960/160) = 1435 / 6 ≈ 239.17 px tall.
    expect(layout.bannerHeightPx).toBeCloseTo(1435 / 6, 5);
    // Top row tall enough (points) to cover the banner height.
    expect(layout.topRowHeightPx).toBeGreaterThanOrEqual(layout.bannerHeightPx);
    // Header lands on row 7 (banner 1, title 2, subtitle 4, date 5).
    expect(layout.headerRowNum).toBe(7);
  });

  it("recomputes height for a different aspect ratio (triangulation)", () => {
    // A square 100x100 image at the same width must be square-tall.
    const layout = computeBannerLayout(columnWidths, 100, 100);
    expect(layout.bannerWidthPx).toBe(1435);
    // Square ratio → height equals width.
    expect(layout.bannerHeightPx).toBeCloseTo(1435, 5);
    // headerRowNum is layout-constant, independent of the image ratio.
    expect(layout.headerRowNum).toBe(7);
  });

  it("scales banner width with the column-width total (triangulation)", () => {
    // Half the columns → half the width.
    const layout = computeBannerLayout([14, 20, 24, 10], 960, 160);
    expect(layout.bannerWidthPx).toBe((14 + 20 + 24 + 10) * 7);
  });
});
