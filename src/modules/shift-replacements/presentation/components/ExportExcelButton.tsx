"use client";

import { useState } from "react";
import { listConfirmedShiftsByDateRangeAction } from "@shift-replacements/presentation/actions/shiftActions";
import { buildConfirmedShiftsWorkbook } from "@shift-replacements/presentation/components/exportConfirmedShiftsWorkbook";
import { fetchLogoBase64 } from "@shift-replacements/presentation/components/fetchLogoBase64";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

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
    const [result, logoBase64] = await Promise.all([
      listConfirmedShiftsByDateRangeAction(start, end),
      fetchLogoBase64(),
    ]);
    setLoading(false);

    if (!result.ok || !result.data) return;

    const wb = buildConfirmedShiftsWorkbook({
      shifts: result.data,
      specialtyNameById,
      start,
      end,
      logoBase64,
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
