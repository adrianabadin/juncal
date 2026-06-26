"use client";

import { useState } from "react";
import {
  createAbsenceReasonAction,
  AbsenceReasonDto,
} from "@absence-reasons/presentation/actions/absenceReasonActions";
import { CreateAbsenceReasonInput } from "@absence-reasons/domain/schemas/absence-reason.schema";
import { ActionResult } from "@shared/presentation/ActionResult";
import Card from "@shared/presentation/ui/Card";
import AbsenceReasonForm from "./AbsenceReasonForm";
import AbsenceReasonActions from "./AbsenceReasonActions";

interface AbsenceReasonItem extends AbsenceReasonDto {
  pending?: boolean;
}

interface AbsenceReasonManagerProps {
  initialReasons: AbsenceReasonDto[];
}

export default function AbsenceReasonManager({
  initialReasons,
}: AbsenceReasonManagerProps) {
  const [items, setItems] = useState<AbsenceReasonItem[]>(initialReasons);

  async function handleCreate(
    data: CreateAbsenceReasonInput,
  ): Promise<ActionResult<AbsenceReasonDto>> {
    const tempId = `temp-${Date.now()}`;
    const optimistic: AbsenceReasonItem = {
      id: tempId,
      name: data.name,
      isDefault: false,
      isActive: true,
      pending: true,
    };
    setItems((prev) => [optimistic, ...prev]);

    const result = await createAbsenceReasonAction(data);

    if (!result.ok) {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      return result;
    }

    const created = result.data as AbsenceReasonDto;
    setItems((prev) =>
      prev.map((i) => (i.id === tempId ? { ...created, pending: false } : i)),
    );
    return result;
  }

  function handleUpdated(dto: AbsenceReasonDto): void {
    setItems((prev) => prev.map((i) => (i.id === dto.id ? { ...dto } : i)));
  }

  function handleDeleted(id: string): void {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Nuevo motivo
        </h2>
        <Card className="max-w-md">
          <AbsenceReasonForm onSubmitCreate={handleCreate} />
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Motivos registrados
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay motivos registrados.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((r) => (
              <Card
                key={r.id}
                className={r.pending ? "opacity-60" : undefined}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{r.name}</p>
                      {r.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                          Por defecto
                        </span>
                      )}
                    </div>
                    {r.pending ? (
                      <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                        Guardando…
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          r.isActive
                            ? "bg-sage-100 text-sage-800 ring-sage-300"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {r.isActive ? "Activo" : "Inactivo"}
                      </span>
                    )}
                  </div>
                  {!r.pending && (
                    <AbsenceReasonActions
                      id={r.id}
                      name={r.name}
                      isDefault={r.isDefault}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
