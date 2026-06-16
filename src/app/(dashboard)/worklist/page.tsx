import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import { listOpenBySpecialtyAction } from "@shift-replacements/presentation/actions/shiftActions";
import OpenShiftsList from "@shift-replacements/presentation/components/OpenShiftsList";
import RequestAbsenceButton from "@shift-replacements/presentation/components/RequestAbsenceButton";

export default async function WorklistPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  const specialtiesResult = await listSpecialtiesAction();
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];

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
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Worklist de especialidad
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitá una ausencia o postulate a un reemplazo abierto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RequestAbsenceButton specialties={specialties} />
          <Link href="/dashboard" className="text-sm text-link hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
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
