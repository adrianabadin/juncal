"use client";

import { useState } from "react";
import { listConfirmedShiftsForRRHHAction } from "@shift-replacements/presentation/actions/shiftActions";
import { buildConfirmedShiftsWorkbook } from "@shift-replacements/presentation/components/exportConfirmedShiftsWorkbook";
import { fetchLogoBase64 } from "@shift-replacements/presentation/components/fetchLogoBase64";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RrhhExportButtonProps {
  specialties: SpecialtyOption[];
  start: string;
  end: string;
  specialtyId?: string;
  bajoFactura?: boolean;
}

export default function RrhhExportButton({
  specialties,
  start,
  end,
  specialtyId,
  bajoFactura,
}: RrhhExportButtonProps) {
  const specialtyNameById = new Map(specialties.map((s) => [s.id, s.name]));
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const [result, logoBase64] = await Promise.all([
      listConfirmedShiftsForRRHHAction({ start, end, specialtyId, bajoFactura }),
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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reemplazos-rrhh-${start.slice(0, 7)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" isLoading={loading} onClick={handleExport}>
      Exportar a Excel
    </Button>
  );
}
