import { redirect } from "next/navigation";
import { getCurrentActor } from "@users/presentation/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
