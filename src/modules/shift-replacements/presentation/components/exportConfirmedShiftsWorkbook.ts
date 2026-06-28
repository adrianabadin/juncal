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
] as const;

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
    views: [{ state: "frozen", ySplit: 6 }],
  });

  ws.columns = [
    { header: "", key: "fecha", width: 14 },
    { header: "", key: "especialidad", width: 20 },
    { header: "", key: "solicitante", width: 24 },
    { header: "", key: "entrada", width: 10 },
    { header: "", key: "salida", width: 10 },
    { header: "", key: "modulo", width: 10 },
    { header: "", key: "coberturas", width: 55 },
  ];

  if (logoBase64) {
    const imageId = wb.addImage({ base64: logoBase64, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 120, height: 40 },
    });
  }

  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
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
  ws.getRow(1).height = 36;

  ws.mergeCells("A3:G3");
  const subTitle = ws.getCell("A3");
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
  ws.getRow(3).height = 28;

  const dateRange = `Desde: ${formatDate(new Date(start).toISOString())}  —  Hasta: ${formatDate(new Date(end).toISOString())}`;
  ws.mergeCells("A4:G4");
  const dateCell = ws.getCell("A4");
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
  ws.getRow(4).height = 24;

  const headerRow = ws.getRow(6);
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
    const rowNum = 7 + idx;
    const row = ws.getRow(rowNum);
    const isAlt = idx % 2 === 0;
    const fillColor = isAlt ? BRAND.sageLight : BRAND.white;

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
