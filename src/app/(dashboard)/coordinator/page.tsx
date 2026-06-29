import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import {
  listPostulatedAction,
  listConfirmedShiftsAction,
  listOpenShiftsAction,
  PostulatedShiftDto,
  ShiftDto,
} from "@shift-replacements/presentation/actions/shiftActions";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import { listActiveAbsenceReasonsAction } from "@absence-reasons/presentation/actions/absenceReasonActions";
import ResolveActions from "@shift-replacements/presentation/components/ResolveActions";
import AssignCompulsoryButton from "@shift-replacements/presentation/components/AssignCompulsoryButton";
import ExportExcelButton from "@shift-replacements/presentation/components/ExportExcelButton";
import Badge from "@shared/presentation/ui/Badge";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { formatShiftDateLabel, formatShiftTime } from "@shift-replacements/presentation/components/worklistFormat";

export default async function CoordinatorPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const [postulatedResult, confirmedResult, specialtiesResult, openShiftsResult, reasonsResult] =
    await Promise.all([
      listPostulatedAction(),
      listConfirmedShiftsAction(),
      listSpecialtiesAction(),
      listOpenShiftsAction(),
      listActiveAbsenceReasonsAction(),
    ]);

  const postulatedShifts: PostulatedShiftDto[] = postulatedResult.ok
    ? (postulatedResult.data ?? [])
    : [];
  const confirmedShifts: PostulatedShiftDto[] = confirmedResult.ok
    ? (confirmedResult.data ?? [])
    : [];
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];
  const openShifts: ShiftDto[] = openShiftsResult.ok
    ? (openShiftsResult.data ?? [])
    : [];
  const reasons = reasonsResult.ok ? (reasonsResult.data ?? []) : [];

  const specialtyNameById = new Map(specialties.map((s) => [s.id, s.name]));

  function ShiftRow({ shift }: { shift: PostulatedShiftDto }) {
    return (
      <li className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-slate-900">
            {formatShiftDateLabel(shift.requesterStart)}
          </p>
          <p className="text-xs text-muted-foreground">
            Solicitante: {shift.requesterName} ·{" "}
            Especialidad: {specialtyNameById.get(shift.specialtyId) ?? shift.specialtyId}{" "}
            · Módulo: {shift.moduleHours}h
          </p>
          <p className="text-xs text-muted-foreground">
            {formatShiftTime(shift.requesterStart)} – {formatShiftTime(shift.requesterEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge state={shift.state as RequestState} />
          {shift.state === RequestState.OPEN && (
            <ResolveActions shiftId={shift.id} />
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Gestión de Reemplazos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resolvé los reemplazos con coberturas y asigná coberturas
            compulsivas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AssignCompulsoryButton
            specialties={specialties}
            openShifts={openShifts.map((s) => ({
              id: s.id,
              date: s.date,
              specialtyId: s.specialtyId,
              requesterStart: s.requesterStart,
              requesterEnd: s.requesterEnd,
            }))}
            reasons={reasons}
          />
          <Link href="/dashboard" className="text-sm text-link hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Solicitudes pendientes de resolución
        </h2>
        {postulatedShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay solicitudes pendientes de resolución.
          </p>
        ) : (
          <ul className="w-full divide-y divide-slate-200">
            {postulatedShifts.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-700">
            Aprobados del mes
          </h2>
           <ExportExcelButton specialties={specialties} />
        </div>
        {confirmedShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay reemplazos aprobados este mes.
          </p>
        ) : (
          <ul className="w-full divide-y divide-slate-200">
            {confirmedShifts.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
