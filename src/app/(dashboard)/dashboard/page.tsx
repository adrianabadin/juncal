import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import LogoutButton from "@users/presentation/components/LogoutButton";

export default async function DashboardPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  const roleLabel =
    actor.role === Role.COORDINATOR ? "Coordinador" : "Profesional de base";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenido/a, {actor.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Rol: {roleLabel}</p>
        </div>
        <LogoutButton />
      </div>

      <nav className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-700">Secciones</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="/worklist"
              className="block rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-slate-50"
            >
              Worklist de especialidad — solicitar ausencia y postularse
            </Link>
          </li>
          {actor.role === Role.COORDINATOR && (
            <>
              <li>
                <Link
                  href="/coordinator"
                  className="block rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-slate-50"
                >
                  Worklist general — gestionar reemplazos postulados
                </Link>
              </li>
              <li>
                <Link
                  href="/specialties"
                  className="block rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-slate-50"
                >
                  Especialidades — ABM
                </Link>
              </li>
              <li>
                <Link
                  href="/users"
                  className="block rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-slate-50"
                >
                  Validación de cuentas — activar usuarios
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
