"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { listConfirmedShiftsByDateRangeAction } from "@shift-replacements/presentation/actions/shiftActions";
import Button from "@shared/presentation/ui/Button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExportExcelButton() {
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

    const rows = result.data.map((s) => ({
      Fecha: formatDate(s.requesterStart),
      Especialidad: s.specialtyId,
      Solicitante: s.requesterName,
      Entrada: formatTime(s.requesterStart),
      Salida: formatTime(s.requesterEnd),
      Módulo: `${s.moduleHours}h`,
      Coberturas: s.coverages.map((c) => `${c.applicantName} (${formatTime(c.start)}-${formatTime(c.end)})`).join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
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