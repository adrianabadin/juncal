"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  assignCompulsoryCoverageSchema,
} from "@shift-replacements/domain/schemas/shift-replacement.schema";
import {
  assignCompulsoryCoverageAction,
  createCompulsoryAction,
} from "@shift-replacements/presentation/actions/shiftActions";
import {
  listUsersBySpecialtyAction,
  UserOptionDto,
} from "@users/presentation/actions/userAdminActions";
import {
  AbsenceReasonOption,
  absenceFormDefaults,
  isCustomReason,
  resolveAbsenceReasonName,
  visibleAbsenceReasons,
} from "@shift-replacements/presentation/components/absenceMotivoForm";
import { useToast } from "@shared/presentation/ui/Toast";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface ShiftOption {
  id: string;
  date: string;
  specialtyId: string;
  requesterStart: string;
  requesterEnd: string;
}

interface AssignCompulsoryFormProps {
  specialties: SpecialtyOption[];
  openShifts: ShiftOption[];
  reasons: AbsenceReasonOption[];
}

const selectClass = (hasError: boolean): string =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-base text-slate-900 min-h-11 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    hasError ? "border-red-500" : "border-slate-300",
  ].join(" ");

// ── Modo 1: Agregar cobertura a solicitud existente ───────────────────────

function ExistingShiftForm({ specialties, openShifts }: AssignCompulsoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<UserOptionDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const existingSchema = z.object({
    shiftId: z.string().min(1, "Requerido"),
    applicantId: z.string().min(1, "Requerido"),
    start: z.string().min(1, "Requerido"),
    end: z.string().min(1, "Requerido"),
  });
  type ExistingInput = z.infer<typeof existingSchema>;

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExistingInput>({
    resolver: zodResolver(existingSchema),
    defaultValues: { shiftId: "", applicantId: "", start: "", end: "" },
  });

  const shiftId = watch("shiftId");
  const start = watch("start");
  const end = watch("end");
  const selectedShift = openShifts.find((s) => s.id === shiftId);

  useEffect(() => {
    let active = true;
    setValue("applicantId", "");
    if (!selectedShift) {
      setDoctors([]);
      setValue("start", "");
      setValue("end", "");
      return;
    }
    setValue("start", selectedShift.requesterStart.slice(0, 16));
    setValue("end", selectedShift.requesterEnd.slice(0, 16));
    setLoadingDoctors(true);
    listUsersBySpecialtyAction(selectedShift.specialtyId).then((res) => {
      if (!active) return;
      setDoctors(res.ok ? (res.data ?? []) : []);
      setLoadingDoctors(false);
    });
    return () => { active = false; };
  }, [selectedShift, setValue]);

  async function onSubmit(data: ExistingInput) {
    const result = await assignCompulsoryCoverageAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      toast(result.error, "error");
      return;
    }
    reset();
    toast("Cobertura asignada exitosamente", "success");
    router.refresh();
  }

  const hasShift = Boolean(selectedShift);
  const noDoctors = hasShift && !loadingDoctors && doctors.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="shiftId" className="text-sm font-medium text-brand-800">Solicitud abierta</label>
            <select id="shiftId" aria-invalid={errors.shiftId ? true : undefined} className={selectClass(Boolean(errors.shiftId))} {...register("shiftId")}>
              <option value="">Seleccioná una solicitud</option>
              {openShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.requesterStart).toLocaleDateString("es-AR")} — {specialties.find((sp) => sp.id === s.specialtyId)?.name ?? s.specialtyId}
                </option>
              ))}
            </select>
            {errors.shiftId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.shiftId.message}</p>}
          </div>
          {noDoctors && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">No hay profesionales activos con esta especialidad.</p>}
          <div className="flex flex-col gap-1">
            <label htmlFor="applicantId" className="text-sm font-medium text-brand-800">Profesional a asignar</label>
            <select id="applicantId" disabled={!hasShift || loadingDoctors || doctors.length === 0} aria-invalid={errors.applicantId ? true : undefined} className={selectClass(Boolean(errors.applicantId))} {...register("applicantId")}>
              <option value="">{loadingDoctors ? "Cargando profesionales…" : "Seleccioná al profesional"}</option>
              {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.email})</option>))}
            </select>
            {errors.applicantId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.applicantId.message}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Input id="start" label="Entrada" type="datetime-local" error={errors.start?.message} {...register("start")} />
          <Input id="end" label="Salida" type="datetime-local" error={errors.end?.message} {...register("end")} />
        </div>
      </div>
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" isLoading={isSubmitting} disabled={noDoctors}>Asignar cobertura</Button>
    </form>
  );
}

// ── Modo 2: Crear desde cero ──────────────────────────────────────────────

function CreateFromScratchForm({
  specialties,
  reasons,
}: {
  specialties: SpecialtyOption[];
  reasons: AbsenceReasonOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<UserOptionDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const scratchSchema = z.object({
    specialtyId: z.string().min(1, "Requerido"),
    moduleHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
    requesterStart: z.string().min(1, "Requerido"),
    requesterEnd: z.string().min(1, "Requerido"),
    requesterId: z.string().min(1, "Requerido"),
    applicantId: z.string().min(1, "Requerido"),
    coverageStart: z.string().min(1, "Requerido"),
    coverageEnd: z.string().min(1, "Requerido"),
    absenceReasonId: z.string().min(1, "Seleccione un motivo"),
    observation: z.string().optional(),
    bajoFactura: z.boolean(),
  });
  type ScratchInput = z.infer<typeof scratchSchema>;

  const {
    register,
    handleSubmit,
    setError,
    watch,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScratchInput>({
    resolver: zodResolver(scratchSchema),
    defaultValues: {
      specialtyId: "",
      moduleHours: 12,
      requesterId: "",
      applicantId: "",
      absenceReasonId: "",
      observation: "",
      bajoFactura: absenceFormDefaults.bajoFactura,
    },
  });

  const specialtyId = useWatch({ control, name: "specialtyId" });
  const absenceReasonId = useWatch({ control, name: "absenceReasonId" });
  const selectedReasonName = resolveAbsenceReasonName(reasons, absenceReasonId);
  const showObservation = isCustomReason(selectedReasonName, reasons);
  const selectableReasons = visibleAbsenceReasons(reasons);
  const requesterId = useWatch({ control, name: "requesterId" });
  const requesterStart = useWatch({ control, name: "requesterStart" });
  const requesterEnd = useWatch({ control, name: "requesterEnd" });
  const moduleHours = useWatch({ control, name: "moduleHours" });
  const userEditedEnd = useRef(false);

  // Auto-fill requesterEnd from requesterStart + moduleHours
  useEffect(() => {
    if (!requesterStart || !moduleHours || userEditedEnd.current) return;
    const start = new Date(requesterStart);
    if (isNaN(start.getTime())) return;
    start.setHours(start.getHours() + Number(moduleHours));
    const pad = (n: number) => String(n).padStart(2, "0");
    const endStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
    setValue("requesterEnd", endStr);
  }, [requesterStart, moduleHours, setValue]);

  // Auto-fill coverage times from requester times
  useEffect(() => {
    if (requesterStart) setValue("coverageStart", requesterStart);
  }, [requesterStart, setValue]);

  useEffect(() => {
    if (requesterEnd) setValue("coverageEnd", requesterEnd);
  }, [requesterEnd, setValue]);

  // Load doctors when specialty changes
  useEffect(() => {
    let active = true;
    setValue("requesterId", "");
    setValue("applicantId", "");
    if (!specialtyId) { setDoctors([]); return; }
    setLoadingDoctors(true);
    listUsersBySpecialtyAction(specialtyId).then((res) => {
      if (!active) return;
      setDoctors(res.ok ? (res.data ?? []) : []);
      setLoadingDoctors(false);
    });
    return () => { active = false; };
  }, [specialtyId, setValue]);

  // Clear applicant if same as requester
  useEffect(() => {
    if (requesterId && watch("applicantId") === requesterId) {
      setValue("applicantId", "");
    }
  }, [requesterId, setValue, watch]);

  async function onSubmit(data: ScratchInput) {
    const reasonName = resolveAbsenceReasonName(reasons, data.absenceReasonId);
    const custom = isCustomReason(reasonName, reasons);
    if (custom && !data.observation?.trim()) {
      setError("observation", { message: "Ingrese una observación" });
      return;
    }

    const result = await createCompulsoryAction({
      ...data,
      isDefault: !custom,
      observation: custom ? data.observation : null,
    });
    if (!result.ok) {
      setError("root", { message: result.error });
      toast(result.error, "error");
      return;
    }
    userEditedEnd.current = false;
    reset({
      specialtyId: "",
      moduleHours: 12,
      requesterId: "",
      applicantId: "",
      absenceReasonId: "",
      observation: "",
      bajoFactura: absenceFormDefaults.bajoFactura,
    });
    toast("Reemplazo compulsivo creado exitosamente", "success");
    router.refresh();
  }

  const applicantOptions = doctors.filter((d) => d.id !== requesterId);
  const hasSpecialty = Boolean(specialtyId);
  const noDoctors = hasSpecialty && !loadingDoctors && doctors.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="specialtyId" className="text-sm font-medium text-brand-800">Especialidad</label>
            <select id="specialtyId" aria-invalid={errors.specialtyId ? true : undefined} className={selectClass(Boolean(errors.specialtyId))} {...register("specialtyId")}>
              <option value="">Seleccioná una especialidad</option>
              {specialties.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            {errors.specialtyId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.specialtyId.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="moduleHours" className="text-sm font-medium text-brand-800">Módulo</label>
            <select id="moduleHours" className={selectClass(false)} {...register("moduleHours")}>
              <option value={6}>6 horas</option>
              <option value={12}>12 horas</option>
              <option value={24}>24 horas</option>
            </select>
          </div>

          {noDoctors && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">No hay profesionales activos con esta especialidad.</p>}

          <div className="flex flex-col gap-1">
            <label htmlFor="requesterId" className="text-sm font-medium text-brand-800">Solicitante (profesional ausente)</label>
            <select id="requesterId" disabled={!hasSpecialty || loadingDoctors || doctors.length === 0} aria-invalid={errors.requesterId ? true : undefined} className={selectClass(Boolean(errors.requesterId))} {...register("requesterId")}>
              <option value="">{loadingDoctors ? "Cargando…" : "Seleccioná al profesional ausente"}</option>
              {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.email})</option>))}
            </select>
            {errors.requesterId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.requesterId.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="applicantId" className="text-sm font-medium text-brand-800">Reemplazante (asignado)</label>
            <select id="applicantId" disabled={!requesterId || applicantOptions.length === 0} aria-invalid={errors.applicantId ? true : undefined} className={selectClass(Boolean(errors.applicantId))} {...register("applicantId")}>
              <option value="">{requesterId ? "Seleccioná al reemplazante" : "Elegí primero al solicitante"}</option>
              {applicantOptions.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.email})</option>))}
            </select>
            {errors.applicantId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.applicantId.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="absenceReasonId" className="text-sm font-medium text-brand-800">Motivo</label>
            <select id="absenceReasonId" aria-invalid={errors.absenceReasonId ? true : undefined} className={selectClass(Boolean(errors.absenceReasonId))} {...register("absenceReasonId")}>
              <option value="">Seleccioná un motivo</option>
              {selectableReasons.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
            {errors.absenceReasonId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.absenceReasonId.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Input id="requesterStart" label="Entrada del turno" type="datetime-local" error={errors.requesterStart?.message} {...register("requesterStart")} />
          <Input id="requesterEnd" label="Salida del turno" type="datetime-local" error={errors.requesterEnd?.message} {...register("requesterEnd")} onChange={(e) => { userEditedEnd.current = true; register("requesterEnd").onChange(e); }} />

          <Input id="coverageStart" label="Entrada de la cobertura" type="datetime-local" error={errors.coverageStart?.message} {...register("coverageStart")} />
          <Input id="coverageEnd" label="Salida de la cobertura" type="datetime-local" error={errors.coverageEnd?.message} {...register("coverageEnd")} />

          {showObservation && (
            <div className="flex flex-col gap-1">
              <label htmlFor="observation" className="text-sm font-medium text-brand-800">Observación</label>
              <textarea id="observation" rows={3} maxLength={500} aria-invalid={errors.observation ? true : undefined} className={selectClass(Boolean(errors.observation))} {...register("observation")} />
              {errors.observation && <p role="alert" className="mt-1 text-sm text-red-600">{errors.observation.message}</p>}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
              {...register("bajoFactura")}
            />
            Bajo factura
          </label>
        </div>
      </div>

      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" isLoading={isSubmitting} disabled={noDoctors}>Crear reemplazo compulsivo</Button>
    </form>
  );
}

// ── Componente principal con tabs ──────────────────────────────────────────

export default function AssignCompulsoryForm(props: AssignCompulsoryFormProps) {
  const [mode, setMode] = useState<"scratch" | "existing">("scratch");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("scratch")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "scratch"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Crear desde cero
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "existing"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          A solicitud existente
        </button>
      </div>
      {mode === "scratch" ? (
        <CreateFromScratchForm specialties={props.specialties} reasons={props.reasons} />
      ) : (
        <ExistingShiftForm specialties={props.specialties} openShifts={props.openShifts} reasons={props.reasons} />
      )}
    </div>
  );
}
