"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@shared/presentation/store/hooks";
import {
  setOpenShifts,
  setSelectedSpecialty,
} from "@shift-replacements/presentation/store/worklist.slice";
import type { ShiftDto } from "@shift-replacements/presentation/actions/shiftActions";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import Card from "@shared/presentation/ui/Card";
import Badge from "@shared/presentation/ui/Badge";
import PostulateButton from "@shift-replacements/presentation/components/PostulateButton";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface OpenShiftsListProps {
  initialShifts: (ShiftDto & { specialtyName: string })[];
  specialties: SpecialtyOption[];
  currentUserId: string;
}

export default function OpenShiftsList({
  initialShifts,
  specialties,
  currentUserId,
}: OpenShiftsListProps) {
  const dispatch = useAppDispatch();
  const { openShifts, selectedSpecialtyId } = useAppSelector((s) => s.worklist);

  useEffect(() => {
    dispatch(setOpenShifts(initialShifts.map((s) => ({ ...s, state: s.state as RequestState }))));
  }, [dispatch, initialShifts]);

  const filteredShifts = selectedSpecialtyId
    ? openShifts.filter((s) => s.specialtyId === selectedSpecialtyId)
    : openShifts;

  // Build a name lookup from the props (initialShifts carries specialtyName per shift)
  const specialtyNameById = new Map<string, string>(
    initialShifts.map((s) => [s.specialtyId, s.specialtyName])
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label
          htmlFor="specialty-filter"
          className="text-sm font-medium text-brand-800"
        >
          Filtrar por especialidad
        </label>
        <select
          id="specialty-filter"
          value={selectedSpecialtyId ?? ""}
          onChange={(e) =>
            dispatch(setSelectedSpecialty(e.target.value || null))
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todas las especialidades</option>
          {specialties.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>
      </div>

      {filteredShifts.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay turnos abiertos disponibles en este momento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredShifts.map((shift) => (
            <Card key={shift.id}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(shift.date).toLocaleDateString("es-AR")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {specialtyNameById.get(shift.specialtyId) ?? shift.specialtyId}
                    </p>
                  </div>
                  <Badge state={shift.state} />
                </div>
                {shift.requesterId !== currentUserId && (
                  <PostulateButton shiftId={shift.id} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
