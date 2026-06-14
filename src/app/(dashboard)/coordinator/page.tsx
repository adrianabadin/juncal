import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import {
  listPostulatedAction,
  listOpenShiftsAction,
  PostulatedShiftDto,
  ShiftDto,
} from "@shift-replacements/presentation/actions/shiftActions";
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

  const [postulatedResult, specialtiesResult, openShiftsResult] =
    await Promise.all([
      listPostulatedAction(),
      listSpecialtiesAction(),
      listOpenShiftsAction(),
    ]);

  const postulatedShifts: PostulatedShiftDto[] = postulatedResult.ok
    ? (postulatedResult.data ?? [])
    : [];
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];
  const openShifts: ShiftDto[] = openShiftsResult.ok
    ? (openShiftsResult.data ?? [])
    : [];

  const specialtyNameById = new Map(specialties.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Worklist general
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resolvé los reemplazos con coberturas y asigná coberturas
            compulsivas.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Solicitudes con coberturas
        </h2>
        {postulatedShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay solicitudes con coberturas pendientes de resolución.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {postulatedShifts.map((shift) => (
              <Card key={shift.id}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-900">
                        {specialtyNameById.get(shift.specialtyId) ?? shift.specialtyId}{" "}
                        — {new Date(shift.requesterStart).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Solicitante: {shift.requesterName} ·{" "}
                        {new Date(shift.requesterStart).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(shift.requesterEnd).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {" "}({shift.moduleHours}h)
                      </p>
                    </div>
                    <Badge state={shift.state as RequestState} />
                  </div>

                  {shift.coverages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-brand-700">
                        Coberturas ({shift.coverages.length}):
                      </p>
                      {shift.coverages.map((cov) => (
                        <div
                          key={cov.id}
                          className="flex items-center justify-between rounded-md bg-brand-50 px-3 py-2 ring-1 ring-brand-100"
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-medium text-slate-900">
                              {cov.applicantName ?? cov.applicantId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cov.start).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                              {" – "}
                              {new Date(cov.end).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}
                              <span className={cov.origin === "COMPULSORY" ? "text-amber-700" : "text-sage-700"}>
                                {cov.origin === "COMPULSORY" ? "Compulsiva" : "Postulación"}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <ResolveActions shiftId={shift.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Asignar cobertura compulsiva
        </h2>
        <Card className="max-w-lg">
          <AssignCompulsoryForm
            specialties={specialties}
            openShifts={openShifts.map((s) => ({
              id: s.id,
              date: s.date,
              specialtyId: s.specialtyId,
              requesterStart: s.requesterStart,
              requesterEnd: s.requesterEnd,
            }))}
          />
        </Card>
      </section>
    </div>
  );
}
