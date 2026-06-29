import ExcelJS from "exceljs";

export interface ExportCoverage {
  applicantName?: string;
  start: string;
  end: string;
}

export interface ExportShift {
  requesterStart: string;
  requesterEnd: string;
  specialtyId: string;
  requesterName?: string;
  moduleHours: number;
  coverages: ExportCoverage[];
  /** Resolved motive name (server-side). Used by `Motivo` column. */
  reasonName?: string | null;
  /** Free-text observation. Surfaced under `Observación` when reason is `Otros`. */
  observation?: string | null;
}

export interface BuildConfirmedShiftsWorkbookInput {
  shifts: ExportShift[];
  specialtyNameById: Map<string, string>;
  start: string;
  end: string;
  /** Base64-encoded PNG of the compact Sanatorio Juncal logo. */
  logoBase64?: string;
}

const BRAND = {
  teal: "045572",
  tealLight: "D6E9F0",
  sage: "7F9976",
  sageLight: "F1F4EF",
  white: "FFFFFF",
  black: "0F172A",
} as const;

const HEADERS = [
  "Fecha",
  "Especialidad",
  "Solicitante",
  "Entrada",
  "Salida",
  "Módulo",
  "Coberturas",
  "Motivo",
  "Observación",
] as const;

/**
 * Approx. pixels-per-character used to convert ExcelJS column widths (which are
 * expressed in characters) into a pixel span. ExcelJS/Excel use ~7px per
 * character of the default font; we use a flat 7 for a stable, testable banner
 * width (see `computeBannerLayout`).
 */
const PX_PER_CHAR = 7;

/** Excel row heights are points; screen pixels → points at 96 DPI ≈ px * 0.75. */
const PX_TO_PT = 0.75;

/** Banner occupies row 1; title 2, subtitle 4, date 5, header 7, data 8+. */
const BANNER_HEADER_ROW = 7;

export interface PngDimensions {
  width: number;
  height: number;
}

/**
 * Reads the intrinsic pixel dimensions from a base64-encoded PNG by parsing its
 * IHDR chunk. PNG layout: 8-byte signature, then the IHDR chunk whose width and
 * height are big-endian uint32 at byte offsets 16 and 20. Pure and synchronous
 * — no `sharp`/IO needed for a header read, which keeps the workbook builder
 * deterministic and testable.
 */
export function parsePngDimensions(base64: string): PngDimensions {
  const buf = Buffer.from(base64, "base64");
  if (buf.length < 24) {
    throw new Error("Invalid PNG: buffer too small to contain an IHDR header");
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

export interface BannerLayout {
  /** Full-width banner span in pixels (sum of column widths × PX_PER_CHAR). */
  bannerWidthPx: number;
  /** Banner height in pixels, derived to preserve the source aspect ratio. */
  bannerHeightPx: number;
  /** Reserved top-row height in pixels (covers the banner so it never overlaps). */
  topRowHeightPx: number;
  /** 1-based worksheet row that holds the column headers. */
  headerRowNum: number;
}

/**
 * Pure layout math for the logo banner. Stretches the image to the full sheet
 * width (sum of column character-widths, converted to pixels) and scales the
 * height to preserve the source aspect ratio so the logo never distorts.
 */
export function computeBannerLayout(
  columnWidths: number[],
  imageWidth: number,
  imageHeight: number,
): BannerLayout {
  const totalChars = columnWidths.reduce((sum, w) => sum + w, 0);
  const bannerWidthPx = totalChars * PX_PER_CHAR;
  const aspectRatio = imageWidth / imageHeight;
  const bannerHeightPx = bannerWidthPx / aspectRatio;
  return {
    bannerWidthPx,
    bannerHeightPx,
    topRowHeightPx: bannerHeightPx,
    headerRowNum: BANNER_HEADER_ROW,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CELL_BORDER = {
  top: { style: "thin" as const, color: { argb: "D0D0D0" } },
  bottom: { style: "thin" as const, color: { argb: "D0D0D0" } },
  left: { style: "thin" as const, color: { argb: "D0D0D0" } },
  right: { style: "thin" as const, color: { argb: "D0D0D0" } },
};

/**
 * Builds the confirmed-shifts workbook shared by coordinator and RRHH exports.
 * Pure: returns an ExcelJS workbook without touching the DOM or downloading.
 */
export function buildConfirmedShiftsWorkbook({
  shifts,
  specialtyNameById,
  start,
  end,
  logoBase64,
}: BuildConfirmedShiftsWorkbookInput): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sanatorio Juncal";
  wb.created = new Date();

  const ws = wb.addWorksheet("Reemplazos", {
    views: [{ state: "frozen", ySplit: BANNER_HEADER_ROW }],
  });

  const columnWidths = [14, 20, 24, 10, 10, 10, 55, 22, 40];
  ws.columns = [
    { header: "", key: "fecha", width: columnWidths[0] },
    { header: "", key: "especialidad", width: columnWidths[1] },
    { header: "", key: "solicitante", width: columnWidths[2] },
    { header: "", key: "entrada", width: columnWidths[3] },
    { header: "", key: "salida", width: columnWidths[4] },
    { header: "", key: "modulo", width: columnWidths[5] },
    { header: "", key: "coberturas", width: columnWidths[6] },
    { header: "", key: "motivo", width: columnWidths[7] },
    { header: "", key: "observacion", width: columnWidths[8] },
  ];

  // Full-width logo banner on row 1. The image is stretched to the sheet width
  // and scaled to preserve its source aspect ratio (the Sanatorio Juncal logo
  // is 6:1), then row 1 is given enough height so the banner never overlaps the
  // title below it. The remaining banner rows (title/subtitle/date) are placed
  // BELOW the image. `editAs: 'oneCell'` keeps the banner anchored to A1 so the
  // empty cells underneath it are not reflowed.
  const headerRowNum = BANNER_HEADER_ROW;
  if (logoBase64) {
    const { width, height } = parsePngDimensions(logoBase64);
    const layout = computeBannerLayout(columnWidths, width, height);
    const imageId = wb.addImage({ base64: logoBase64, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: layout.bannerWidthPx, height: layout.bannerHeightPx },
      editAs: "oneCell",
    });
    // Reserve row 1 height (points) to cover the banner (pixels → points).
    ws.getRow(1).height = layout.topRowHeightPx * PX_TO_PT;
  }

  ws.mergeCells("A2:I2");
  const titleCell = ws.getCell("A2");
  titleCell.value = "Sanatorio Juncal — Gestión de Guardias";
  titleCell.font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: BRAND.white },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND.teal },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 36;

  ws.mergeCells("A4:I4");
  const subTitle = ws.getCell("A4");
  subTitle.value = "REEMPLAZOS CONFIRMADOS";
  subTitle.font = {
    name: "Calibri",
    size: 13,
    bold: true,
    color: { argb: BRAND.white },
  };
  subTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND.sage },
  };
  subTitle.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(4).height = 28;

  const dateRange = `Desde: ${formatDate(new Date(start).toISOString())}  —  Hasta: ${formatDate(new Date(end).toISOString())}`;
  ws.mergeCells("A5:I5");
  const dateCell = ws.getCell("A5");
  dateCell.value = dateRange;
  dateCell.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: BRAND.teal },
  };
  dateCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND.tealLight },
  };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(5).height = 24;

  const headerRow = ws.getRow(headerRowNum);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: BRAND.white },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND.teal },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 22;

  shifts.forEach((s, idx) => {
    const rowNum = headerRowNum + 1 + idx;
    const row = ws.getRow(rowNum);
    const isAlt = idx % 2 === 0;
    const fillColor = isAlt ? BRAND.sageLight : BRAND.white;

    const motivo = s.reasonName ?? "—";
    const observacion =
      s.reasonName === "Otros" && s.observation?.trim()
        ? s.observation
        : "—";

    const values = [
      formatDate(s.requesterStart),
      specialtyNameById.get(s.specialtyId) ?? s.specialtyId,
      s.requesterName,
      formatTime(s.requesterStart),
      formatTime(s.requesterEnd),
      `${s.moduleHours}h`,
      s.coverages
        .map(
          (c) =>
            `${c.applicantName} (${formatTime(c.start)}-${formatTime(c.end)})`,
        )
        .join(", "),
      motivo,
      observacion,
    ];

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: "Calibri", size: 10, color: { argb: BRAND.black } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      cell.border = CELL_BORDER;
      cell.alignment = { vertical: "middle" };
    });
  });

  return wb;
}
