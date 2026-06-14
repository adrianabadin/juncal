import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import SpecialtyForm from "@specialties/presentation/components/SpecialtyForm";
import SpecialtyActions from "@specialties/presentation/components/SpecialtyActions";
import Card from "@shared/presentation/ui/Card";

export default async function SpecialtiesPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const result = await listSpecialtiesAction();
  const specialties = result.ok ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Especialidades</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Nueva especialidad
        </h2>
        <Card className="max-w-md">
          <SpecialtyForm />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Especialidades registradas
        </h2>
        {specialties.length === 0 ? (
          <p className="text-sm text-slate-500">No hay especialidades registradas.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {specialties.map((s) => (
              <Card key={s.id}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{s.name}</p>
                      {s.description && (
                        <p className="text-sm text-slate-500">{s.description}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <SpecialtyActions
                    id={s.id}
                    name={s.name}
                    description={s.description}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
