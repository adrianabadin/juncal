import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import {
  listInactiveUsersAction,
  listActiveUsersAction,
} from "@users/presentation/actions/userAdminActions";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import ActivateUserForm from "@users/presentation/components/ActivateUserForm";
import EditSpecialtiesForm from "@users/presentation/components/EditSpecialtiesForm";
import RoleManager from "@users/presentation/components/RoleManager";
import Card from "@shared/presentation/ui/Card";

export default async function UsersPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const [inactiveResult, specialtiesResult, activeResult] = await Promise.all([
    listInactiveUsersAction(),
    listSpecialtiesAction(),
    listActiveUsersAction(),
  ]);

  const inactiveUsers = inactiveResult.ok ? (inactiveResult.data ?? []) : [];
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];
  const activeUsers = activeResult.ok ? (activeResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Validación de cuentas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activá usuarios nuevos, asigná especialidades y gestioná roles.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Pendientes de activación
        </h2>
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
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <ActivateUserForm
                    userId={user.id}
                    specialties={specialties}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-brand-700">
          Profesionales activos
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Editá las especialidades asignadas a cada profesional.
        </p>
        {activeUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay profesionales activos.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeUsers.map((user) => (
              <Card key={user.id}>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <EditSpecialtiesForm
                    userId={user.id}
                    userName={user.name}
                    specialties={specialties}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-brand-700">
          Gestión de roles
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Asigná el rol Coordinador a otros profesionales para que también
          puedan gestionar.
        </p>
        <RoleManager initialUsers={activeUsers} currentUserId={actor.userId} />
      </section>
    </div>
  );
}
