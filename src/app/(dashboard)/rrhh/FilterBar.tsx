"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  specialties: SpecialtyOption[];
  start: string;
  end: string;
  specialtyId: string;
  bajoFactura: string;
}

const INPUT_CLASS =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function FilterBar({
  specialties,
  start,
  end,
  specialtyId,
  bajoFactura,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/rrhh?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-specialty" className="text-xs font-medium text-brand-800">
          Especialidad
        </label>
        <select
          id="filter-specialty"
          value={specialtyId}
          onChange={(e) => updateParam("specialtyId", e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Todas</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-invoice" className="text-xs font-medium text-brand-800">
          Condición
        </label>
        <select
          id="filter-invoice"
          value={bajoFactura}
          onChange={(e) => updateParam("bajoFactura", e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Todas</option>
          <option value="true">Bajo factura</option>
          <option value="false">Regular</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-start" className="text-xs font-medium text-brand-800">
          Desde
        </label>
        <input
          id="filter-start"
          type="date"
          value={start}
          onChange={(e) => updateParam("start", e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-end" className="text-xs font-medium text-brand-800">
          Hasta
        </label>
        <input
          id="filter-end"
          type="date"
          value={end}
          onChange={(e) => updateParam("end", e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}
