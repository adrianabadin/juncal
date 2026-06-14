import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import { listOpenBySpecialtyAction } from "@shift-replacements/presentation/actions/shiftActions";
import RequestAbsenceForm from "@shift-replacements/presentation/components/RequestAbsenceForm";
import OpenShiftsList from "@shift-replacements/presentation/components/OpenShiftsList";
import Card from "@shared/presentation/ui/Card";

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
        <OpenShiftsList
          initialShifts={allOpenShifts}
          specialties={specialties}
          currentUserId={actor.userId}
        />
      </section>
    </div>
  );
}
