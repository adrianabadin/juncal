import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import { listOpenBySpecialtyAction } from "@shift-replacements/presentation/actions/shiftActions";
import RequestAbsenceForm from "@shift-replacements/presentation/components/RequestAbsenceForm";
import PostulateButton from "@shift-replacements/presentation/components/PostulateButton";
import Card from "@shared/presentation/ui/Card";
import Badge from "@shared/presentation/ui/Badge";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

export default async function WorklistPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  const specialtiesResult = await listSpecialtiesAction();
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];

  // Aggregate open shifts for all specialties
  const openShiftsPerSpecialty = await Promise.all(
    specialties.map(async (s) => {
      const res = await listOpenBySpecialtyAction(s.id);
      return { specialty: s, shifts: res.ok ? (res.data ?? []) : [] };
    })
  );

  const allOpenShifts = openShiftsPerSpecialty.flatMap(({ specialty, shifts }) =>
    shifts.map((shift) => ({ ...shift, specialtyName: specialty.name }))
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Worklist de Especialidad</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Solicitar ausencia
        </h2>
        <Card className="max-w-md">
          <RequestAbsenceForm specialties={specialties} />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Turnos abiertos disponibles
        </h2>
        {allOpenShifts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay turnos abiertos disponibles en este momento.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allOpenShifts.map((shift) => (
              <Card key={shift.id}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(shift.date).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-slate-500">{shift.specialtyName}</p>
                    </div>
                    <Badge state={shift.state as RequestState} />
                  </div>
                  {shift.requesterId !== actor.userId && (
                    <PostulateButton shiftId={shift.id} />
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
