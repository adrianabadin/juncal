"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import { listAbsenceReasonsAction } from "@absence-reasons/presentation/actions/absenceReasonActions";
import AbsenceReasonManager from "@absence-reasons/presentation/components/AbsenceReasonManager";

export default async function MotivosPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.COORDINATOR) redirect("/dashboard");

  const result = await listAbsenceReasonsAction();
  const reasons = result.ok ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Motivos de ausencia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alta, edición, desactivación y eliminación de motivos de ausencia.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      <AbsenceReasonManager initialReasons={reasons} />
    </div>
  );
}
