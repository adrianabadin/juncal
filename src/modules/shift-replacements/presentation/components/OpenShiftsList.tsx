"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@shared/presentation/store/hooks";
import {
  setOpenShifts,
  setSelectedSpecialty,
} from "@shift-replacements/presentation/store/worklist.slice";
import type { ShiftDto } from "@shift-replacements/presentation/actions/shiftActions";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import Badge from "@shared/presentation/ui/Badge";
import PostulateButton from "@shift-replacements/presentation/components/PostulateButton";
import { formatShiftDateLabel, formatShiftTime } from "@shift-replacements/presentation/components/worklistFormat";

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
        <ul className="w-full divide-y divide-slate-200">
          {filteredShifts.map((shift) => (
            <li
              key={shift.id}
              className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-900">
                  {formatShiftDateLabel(shift.requesterStart)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solicitante: {shift.requesterName ?? shift.requesterId} ·{" "}
                  Especialidad: {specialtyNameById.get(shift.specialtyId) ?? shift.specialtyId}{" "}
                  · Módulo: {shift.moduleHours}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatShiftTime(shift.requesterStart)} – {formatShiftTime(shift.requesterEnd)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge state={shift.state} />
                {shift.requesterId !== currentUserId && (
                  <PostulateButton
                    shiftId={shift.id}
                    shiftStart={shift.requesterStart}
                    shiftEnd={shift.requesterEnd}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
