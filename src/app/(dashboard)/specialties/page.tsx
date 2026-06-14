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
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Especialidades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alta, baja y modificación de especialidades.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Nueva especialidad
        </h2>
        <Card className="max-w-md">
          <SpecialtyForm />
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Especialidades registradas
        </h2>
        {specialties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay especialidades registradas.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {specialties.map((s) => (
              <Card key={s.id}>
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        s.isActive
                          ? "bg-sage-100 text-sage-800 ring-sage-300"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
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
