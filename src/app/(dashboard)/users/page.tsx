import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import { listInactiveUsersAction } from "@users/presentation/actions/userAdminActions";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import ActivateUserForm from "@users/presentation/components/ActivateUserForm";
import Card from "@shared/presentation/ui/Card";

export default async function UsersPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const [inactiveResult, specialtiesResult] = await Promise.all([
    listInactiveUsersAction(),
    listSpecialtiesAction(),
  ]);

  const inactiveUsers = inactiveResult.ok ? (inactiveResult.data ?? []) : [];
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Validación de cuentas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activá usuarios nuevos y asigná sus especialidades.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      {inactiveUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay usuarios pendientes de activación.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {inactiveUsers.map((user) => (
            <Card key={user.id}>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <ActivateUserForm userId={user.id} specialties={specialties} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
