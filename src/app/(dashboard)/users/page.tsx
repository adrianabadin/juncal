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
        <h1 className="text-2xl font-bold text-slate-900">
          Validación de cuentas
        </h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>

      {inactiveUsers.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay usuarios pendientes de activación.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {inactiveUsers.map((user) => (
            <Card key={user.id}>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
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
