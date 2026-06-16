"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
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
  gray: "51606B",
};

function cellStyle(font?: object, fill?: object, border?: object, align?: object) {
  return { font: font ?? {}, fill: fill ?? {}, border: border ?? {}, alignment: align ?? {} };
}

const thinBorder = [
  { style: "thin", color: { rgb: "D0D0D0" } },
  { style: "thin", color: { rgb: "D0D0D0" } },
  { style: "thin", color: { rgb: "D0D0D0" } },
  { style: "thin", color: { rgb: "D0D0D0" } },
];

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

    const dateRange = `Desde: ${formatDate(new Date(start).toISOString())}  Hasta: ${formatDate(new Date(end).toISOString())}`;
    const headerRow = ["Fecha", "Especialidad", "Solicitante", "Entrada", "Salida", "Módulo", "Coberturas"];
    const data = result.data.map((s) => [
      formatDate(s.requesterStart),
      specialtyNameById.get(s.specialtyId) ?? s.specialtyId,
      s.requesterName,
      formatTime(s.requesterStart),
      formatTime(s.requesterEnd),
      `${s.moduleHours}h`,
      s.coverages.map((c) => `${c.applicantName} (${formatTime(c.start)}-${formatTime(c.end)})`).join(", "),
    ]);

    const aoa: (string | object)[][] = [
      ["Sanatorio Juncal — Gestión de Guardias"],
      [],
      ["REEMPLAZOS CONFIRMADOS"],
      [dateRange],
      [],
      headerRow,
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws["!cols"] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 55 },
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
    ];

    const setCell = (ref: string, value: string, style: object) => {
      ws[ref] = { t: "s", v: value, s: style };
    };

    setCell("A1", "Sanatorio Juncal — Gestión de Guardias", cellStyle(
      { bold: true, sz: 16, color: { rgb: BRAND.white } },
      { fgColor: { rgb: BRAND.teal } },
      [],
      { horizontal: "center", vertical: "center" },
    ));

    setCell("A3", "REEMPLAZOS CONFIRMADOS", cellStyle(
      { bold: true, sz: 13, color: { rgb: BRAND.white } },
      { fgColor: { rgb: BRAND.sage } },
      [],
      { horizontal: "center", vertical: "center" },
    ));

    setCell("A4", dateRange, cellStyle(
      { bold: true, sz: 11, color: { rgb: BRAND.teal } },
      { fgColor: { rgb: BRAND.tealLight } },
      [],
      { horizontal: "center", vertical: "center" },
    ));

    headerRow.forEach((h, i) => {
      const col = String.fromCharCode(65 + i);
      setCell(`${col}6`, h, cellStyle(
        { bold: true, sz: 10, color: { rgb: BRAND.white } },
        { fgColor: { rgb: BRAND.teal } },
        thinBorder,
        { horizontal: "center", vertical: "center" },
      ));
    });

    data.forEach((row, rowIdx) => {
      const rowNum = 7 + rowIdx;
      const isAlt = rowIdx % 2 === 0;
      row.forEach((val, colIdx) => {
        const col = String.fromCharCode(65 + colIdx);
        const cellRef = `${col}${rowNum}`;
        const value = typeof val === "string" ? val : String(val);
        ws[cellRef] = {
          t: "s",
          v: value,
          s: cellStyle(
            { sz: 10, color: { rgb: BRAND.black } },
            { fgColor: { rgb: isAlt ? BRAND.sageLight : BRAND.white } },
            thinBorder,
            { vertical: "center" },
          ),
        };
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reemplazos");
    XLSX.writeFile(wb, `reemplazos-${start.slice(0, 7)}.xlsx`);
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
