import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import Card from "@shared/presentation/ui/Card";

interface SectionCard {
  href: string;
  title: string;
  description: string;
}

export default async function DashboardPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  const isCoordinator = actor.role === Role.COORDINATOR;
  const isRRHH = actor.role === Role.RRHH;
  const roleLabel = isCoordinator
    ? "Coordinador"
    : isRRHH
      ? "Recursos Humanos"
      : "Profesional de base";

  const sections: SectionCard[] = [
    ...(isRRHH
      ? [
          {
            href: "/rrhh",
            title: "Tablero RRHH",
            description:
              "Análisis de reemplazos aprobados con filtros y exportación.",
          },
        ]
      : [
          {
            href: "/worklist",
            title: "Listado de Solicitudes",
            description:
              "Solicitá una ausencia o postulate a un reemplazo abierto.",
          },
        ]),
    ...(isCoordinator
      ? [
          {
            href: "/coordinator",
            title: "Gestión de Reemplazos",
            description:
              "Resolvé los reemplazos postulados y asigná compulsivos.",
          },
          {
            href: "/rrhh",
            title: "Panel RRHH (estadísticas)",
            description:
              "Vista analítica de reemplazos aprobados: KPIs, filtros y exportación.",
          },
          {
            href: "/specialties",
            title: "Especialidades",
            description: "Alta, baja y modificación de especialidades.",
          },
          {
            href: "/motivos",
            title: "Motivos de ausencia",
            description: "Alta, edición, desactivación y eliminación de motivos.",
          },
          {
            href: "/users",
            title: "Validación de cuentas",
            description: "Activá usuarios nuevos y asigná sus especialidades.",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-800">
          Hola, {actor.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Rol: {roleLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Card className="h-full transition-colors hover:border-brand-300">
              <h2 className="text-base font-semibold text-brand-700">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
