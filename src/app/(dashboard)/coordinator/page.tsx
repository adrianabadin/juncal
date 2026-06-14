import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import { listPostulatedAction, PostulatedShiftDto } from "@shift-replacements/presentation/actions/shiftActions";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import ResolveActions from "@shift-replacements/presentation/components/ResolveActions";
import AssignCompulsoryForm from "@shift-replacements/presentation/components/AssignCompulsoryForm";
import Card from "@shared/presentation/ui/Card";
import Badge from "@shared/presentation/ui/Badge";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

export default async function CoordinatorPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const [postulatedResult, specialtiesResult] = await Promise.all([
    listPostulatedAction(),
    listSpecialtiesAction(),
  ]);

  const postulatedShifts: PostulatedShiftDto[] = postulatedResult.ok
    ? (postulatedResult.data ?? [])
    : [];
  const specialties = specialtiesResult.ok
    ? (specialtiesResult.data ?? [])
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Worklist General</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Reemplazos postulados
        </h2>
        {postulatedShifts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay reemplazos postulados en este momento.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {postulatedShifts.map((shift) => (
              <Card key={shift.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-900">
                        Fecha: {new Date(shift.date).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-slate-500">
                        Solicitante: {shift.requesterName}
                      </p>
                      {shift.applicantId && (
                        <p className="text-xs text-slate-500">
                          Postulante: {shift.applicantName ?? "—"}
                        </p>
                      )}
                    </div>
                    <Badge state={shift.state as RequestState} />
                  </div>
                  <ResolveActions shiftId={shift.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Asignar reemplazo compulsivo
        </h2>
        <Card className="max-w-lg">
          <AssignCompulsoryForm specialties={specialties} />
        </Card>
      </section>
    </div>
  );
}
