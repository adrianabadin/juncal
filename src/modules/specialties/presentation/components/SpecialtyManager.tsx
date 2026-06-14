"use client";

import { useState } from "react";
import {
  createSpecialtyAction,
  SpecialtyDto,
} from "@specialties/presentation/actions/specialtyActions";
import { CreateSpecialtyInput } from "@specialties/domain/schemas/specialty.schema";
import { ActionResult } from "@shared/presentation/ActionResult";
import Card from "@shared/presentation/ui/Card";
import SpecialtyForm from "./SpecialtyForm";
import SpecialtyActions from "./SpecialtyActions";

interface SpecialtyItem extends SpecialtyDto {
  pending?: boolean;
}

interface SpecialtyManagerProps {
  initialSpecialties: SpecialtyDto[];
}

export default function SpecialtyManager({
  initialSpecialties,
}: SpecialtyManagerProps) {
  const [items, setItems] = useState<SpecialtyItem[]>(initialSpecialties);

  // Optimistic add: agrega la card al instante, luego confirma contra la DB
  // y reconcilia el id temporal con el real (o revierte si falla).
  async function handleCreate(
    data: CreateSpecialtyInput,
  ): Promise<ActionResult<SpecialtyDto>> {
    const tempId = `temp-${Date.now()}`;
    const optimistic: SpecialtyItem = {
      id: tempId,
      name: data.name,
      description: data.description?.trim() ? data.description : null,
      isActive: true,
      pending: true,
    };
    setItems((prev) => [optimistic, ...prev]);

    const result = await createSpecialtyAction(data);

    if (!result.ok) {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      return result;
    }

    const created = result.data;
    setItems((prev) =>
      prev.map((i) =>
        i.id === tempId ? { ...(created as SpecialtyDto), pending: false } : i,
      ),
    );
    return result;
  }

  function handleUpdated(dto: SpecialtyDto): void {
    setItems((prev) => prev.map((i) => (i.id === dto.id ? { ...dto } : i)));
  }

  function handleDeleted(id: string): void {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Nueva especialidad
        </h2>
        <Card className="max-w-md">
          <SpecialtyForm onSubmitCreate={handleCreate} />
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Especialidades registradas
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay especialidades registradas.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => (
              <Card
                key={s.id}
                className={s.pending ? "opacity-60" : undefined}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{s.name}</p>
                      {s.description && (
                        <p className="text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                    </div>
                    {s.pending ? (
                      <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                        Guardando…
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          s.isActive
                            ? "bg-sage-100 text-sage-800 ring-sage-300"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {s.isActive ? "Activa" : "Inactiva"}
                      </span>
                    )}
                  </div>
                  {!s.pending && (
                    <SpecialtyActions
                      id={s.id}
                      name={s.name}
                      description={s.description}
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
