"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import { listConfirmedShiftsByDateRangeAction } from "@shift-replacements/presentation/actions/shiftActions";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
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

const BRAND = {
  teal: "045572",
  tealLight: "D6E9F0",
  sage: "7F9976",
  sageLight: "F1F4EF",
  white: "FFFFFF",
  black: "0F172A",
};

export default function ExportExcelButton({ specialties }: { specialties: SpecialtyOption[] }) {
  const specialtyNameById = new Map(specialties.map((s) => [s.id, s.name]));
  const [start, setStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [end, setEnd] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const result = await listConfirmedShiftsByDateRangeAction(start, end);
    setLoading(false);

    if (!result.ok || !result.data) return;

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

    ws.mergeCells("A1:G1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "Sanatorio Juncal — Gestión de Guardias";
    titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: BRAND.white } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.teal } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 36;

    ws.mergeCells("A3:G3");
    const subTitle = ws.getCell("A3");
    subTitle.value = "REEMPLAZOS CONFIRMADOS";
    subTitle.font = { name: "Calibri", size: 13, bold: true, color: { argb: BRAND.white } };
    subTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.sage } };
    subTitle.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(3).height = 28;

    const dateRange = `Desde: ${formatDate(new Date(start).toISOString())}  —  Hasta: ${formatDate(new Date(end).toISOString())}`;
    ws.mergeCells("A4:G4");
    const dateCell = ws.getCell("A4");
    dateCell.value = dateRange;
    dateCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: BRAND.teal } };
    dateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.tealLight } };
    dateCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(4).height = 24;

    const headers = ["Fecha", "Especialidad", "Solicitante", "Entrada", "Salida", "Módulo", "Coberturas"];
    const headerRow = ws.getRow(6);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRAND.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.teal } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "D0D0D0" } },
        bottom: { style: "thin", color: { argb: "D0D0D0" } },
        left: { style: "thin", color: { argb: "D0D0D0" } },
        right: { style: "thin", color: { argb: "D0D0D0" } },
      };
    });
    headerRow.height = 22;

    result.data.forEach((s, idx) => {
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
        s.coverages.map((c) => `${c.applicantName} (${formatTime(c.start)}-${formatTime(c.end)})`).join(", "),
      ];

      values.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: "Calibri", size: 10, color: { argb: BRAND.black } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
        cell.border = {
          top: { style: "thin", color: { argb: "D0D0D0" } },
          bottom: { style: "thin", color: { argb: "D0D0D0" } },
          left: { style: "thin", color: { argb: "D0D0D0" } },
          right: { style: "thin", color: { argb: "D0D0D0" } },
        };
        cell.alignment = { vertical: "middle" };
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reemplazos-${start.slice(0, 7)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="export-start" className="text-xs font-medium text-brand-800">Desde</label>
        <input
          id="export-start"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="export-end" className="text-xs font-medium text-brand-800">Hasta</label>
        <input
          id="export-end"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <Button variant="secondary" isLoading={loading} onClick={handleExport}>
        Exportar a Excel
      </Button>
    </div>
  );
}
