import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import SpecialtyManager from "@specialties/presentation/components/SpecialtyManager";

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

      <SpecialtyManager initialSpecialties={specialties} />
    </div>
  );
}
