import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import { Role } from "@users/domain/enums/Role";
import {
  listConfirmedShiftsForRRHHAction,
  countRegisteredReplacementsForRRHHAction,
  PostulatedShiftDto,
} from "@shift-replacements/presentation/actions/shiftActions";
import { listSpecialtiesAction } from "@specialties/presentation/actions/specialtyActions";
import { listAbsenceReasonsAction } from "@absence-reasons/presentation/actions/absenceReasonActions";
import { computeRrhhMetrics } from "@shift-replacements/presentation/rrhh/rrhhMetrics";
import Card from "@shared/presentation/ui/Card";
import FilterBar from "./FilterBar";
import RrhhExportButton from "./RrhhExportButton";

interface RrhhSearchParams {
  specialtyId?: string;
  bajoFactura?: string;
  start?: string;
  end?: string;
}

function defaultRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${d}` };
}

function parseBajoFactura(raw?: string): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RrhhPage({
  searchParams,
}: {
  searchParams: Promise<RrhhSearchParams>;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== Role.RRHH) redirect("/dashboard");

  const params = await searchParams;
  const fallback = defaultRange();
  const start = params.start || fallback.start;
  const end = params.end || fallback.end;
  const specialtyId = params.specialtyId || undefined;
  const bajoFactura = parseBajoFactura(params.bajoFactura);
  const filters = { start, end, specialtyId, bajoFactura };

  const [shiftsResult, registeredResult, specialtiesResult, reasonsResult] =
    await Promise.all([
      listConfirmedShiftsForRRHHAction(filters),
      countRegisteredReplacementsForRRHHAction(filters),
      listSpecialtiesAction(),
      listAbsenceReasonsAction(),
    ]);

  const shifts: PostulatedShiftDto[] = shiftsResult.ok
    ? (shiftsResult.data ?? [])
    : [];
  const totalRegistered =
    registeredResult.ok && registeredResult.data !== undefined
      ? registeredResult.data
      : shifts.length;
  const specialties = specialtiesResult.ok ? (specialtiesResult.data ?? []) : [];
  const reasons = reasonsResult.ok ? (reasonsResult.data ?? []) : [];

  const specialtyNameById = new Map(specialties.map((s) => [s.id, s.name]));
  const reasonNameById = new Map(reasons.map((r) => [r.id, r.name]));

  const metrics = computeRrhhMetrics(shifts, {
    specialtyNameById,
    reasonNameById,
    totalRegistered,
  });

  const kpis: { label: string; value: string }[] = [
    { label: "Reemplazos aprobados", value: String(metrics.totalApproved) },
    {
      label: metrics.approvalRate.label,
      value: `${Math.round(metrics.approvalRate.value * 100)}% (${metrics.approvalRate.approved}/${metrics.approvalRate.registered})`,
    },
    { label: "Motivo más frecuente", value: metrics.mostFrequentReason },
    { label: "Especialidad con más demanda", value: metrics.highestDemandSpecialty },
    {
      label: "Distribución de facturación",
      value: `Bajo factura ${metrics.invoiceDistribution.bajoFactura} · Regular ${metrics.invoiceDistribution.regular}`,
    },
    { label: "Horas cubiertas", value: `${metrics.coveredHours.toFixed(1)}h` },
    {
      label: "Horas promedio por reemplazo",
      value: `${metrics.avgHoursPerReplacement.toFixed(1)}h`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">
            Tablero RRHH
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Análisis de reemplazos aprobados con filtros y exportación.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-link hover:underline">
          Volver al inicio
        </Link>
      </div>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <FilterBar
          specialties={specialties}
          start={start}
          end={end}
          specialtyId={specialtyId ?? ""}
          bajoFactura={params.bajoFactura ?? ""}
        />
        <RrhhExportButton
          specialties={specialties}
          start={start}
          end={end}
          specialtyId={specialtyId}
          bajoFactura={bajoFactura}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-brand-800">
              {kpi.value}
            </p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-700">
          Reemplazos aprobados
        </h2>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay reemplazos aprobados para los filtros seleccionados.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Especialidad</th>
                  <th className="px-3 py-2">Solicitante</th>
                  <th className="px-3 py-2">Entrada</th>
                  <th className="px-3 py-2">Salida</th>
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2">Bajo Factura</th>
                  <th className="px-3 py-2">Coberturas</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="border-b border-brand-50 align-top"
                  >
                    <td className="px-3 py-2">
                      {formatDate(shift.requesterStart)}
                    </td>
                    <td className="px-3 py-2">
                      {specialtyNameById.get(shift.specialtyId) ??
                        shift.specialtyId}
                    </td>
                    <td className="px-3 py-2">{shift.requesterName}</td>
                    <td className="px-3 py-2">
                      {formatTime(shift.requesterStart)}
                    </td>
                    <td className="px-3 py-2">
                      {formatTime(shift.requesterEnd)}
                    </td>
                    <td className="px-3 py-2">{shift.moduleHours}h</td>
                    <td className="px-3 py-2">
                      {shift.bajoFactura ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-2">
                      {shift.coverages.length === 0
                        ? "—"
                        : shift.coverages
                            .map(
                              (c) =>
                                `${c.applicantName ?? c.applicantId} (${formatTime(c.start)}-${formatTime(c.end)})`,
                            )
                            .join(", ")}
                    </td>
                    <td className="px-3 py-2">{shift.state}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      Solo lectura
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
