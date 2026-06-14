import { redirect } from "next/navigation";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import AppHeader from "@shared/presentation/ui/AppHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  const isCoordinator = actor.role === Role.COORDINATOR;
  const roleLabel = isCoordinator ? "Coordinador" : "Profesional";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        name={actor.name}
        roleLabel={roleLabel}
        isCoordinator={isCoordinator}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
