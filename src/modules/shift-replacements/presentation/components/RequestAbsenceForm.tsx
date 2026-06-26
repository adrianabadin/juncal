"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestAbsenceAction } from "@shift-replacements/presentation/actions/shiftActions";
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

const formSchema = z.object({
  specialtyId: z.string().min(1, "Requerido"),
  moduleHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  requesterStart: z.string().min(1, "Requerido"),
  requesterEnd: z.string().min(1, "Requerido"),
  absenceReasonId: z.string().min(1, "Seleccione un motivo"),
  observation: z.string().optional(),
  bajoFactura: z.boolean(),
});
type FormInput = z.infer<typeof formSchema>;

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RequestAbsenceFormProps {
  specialties: SpecialtyOption[];
  reasons: AbsenceReasonOption[];
}

const selectClass = (hasError: boolean): string =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-base text-slate-900 min-h-11 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500",
    hasError ? "border-red-500" : "border-slate-300",
  ].join(" ");

export default function RequestAbsenceForm({
  specialties,
  reasons,
}: RequestAbsenceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleHours: 12,
      absenceReasonId: "",
      observation: "",
      bajoFactura: absenceFormDefaults.bajoFactura,
    },
  });

  const selectableReasons = visibleAbsenceReasons(reasons);

  const moduleHours = useWatch({ control, name: "moduleHours" });
  const requesterStart = useWatch({ control, name: "requesterStart" });
  const absenceReasonId = useWatch({ control, name: "absenceReasonId" });
  const selectedReasonName = resolveAbsenceReasonName(reasons, absenceReasonId);
  const showObservation = isCustomReason(selectedReasonName, reasons);
  const userEditedEnd = useRef(false);

  useEffect(() => {
    if (!requesterStart || !moduleHours || userEditedEnd.current) return;
    const start = new Date(requesterStart);
    if (isNaN(start.getTime())) return;
    start.setHours(start.getHours() + moduleHours);
    const pad = (n: number) => String(n).padStart(2, "0");
    const endStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
    setValue("requesterEnd", endStr);
  }, [requesterStart, moduleHours, setValue]);

  async function onSubmit(data: FormInput) {
    const reasonName = resolveAbsenceReasonName(reasons, data.absenceReasonId);
    const custom = isCustomReason(reasonName, reasons);
    if (custom && !data.observation?.trim()) {
      setError("observation", { message: "Ingrese una observación" });
      return;
    }

    const result = await requestAbsenceAction({
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
      moduleHours: 12,
      absenceReasonId: "",
      observation: "",
      bajoFactura: absenceFormDefaults.bajoFactura,
    });
    router.refresh();
    toast("Solicitud de ausencia creada", "success");
  }

  return (
    // react-hooks/refs false positive: RHF's `handleSubmit` reads its internal
    // refs at event time, not during render. The rule cannot see through the
    // library boundary. Scoped disable for this single line only.
    // eslint-disable-next-line react-hooks/refs
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="specialtyId"
          className="text-sm font-medium text-brand-800"
        >
          Especialidad
        </label>
        <select
          id="specialtyId"
          aria-invalid={errors.specialtyId ? true : undefined}
          className={selectClass(Boolean(errors.specialtyId))}
          {...register("specialtyId")}
        >
          <option value="">Seleccioná una especialidad</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.specialtyId && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.specialtyId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="moduleHours"
          className="text-sm font-medium text-brand-800"
        >
          Módulo
        </label>
        <select
          id="moduleHours"
          aria-invalid={errors.moduleHours ? true : undefined}
          className={selectClass(Boolean(errors.moduleHours))}
          {...register("moduleHours")}
        >
          <option value={6}>6 horas</option>
          <option value={12}>12 horas</option>
          <option value={24}>24 horas</option>
        </select>
        {errors.moduleHours && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.moduleHours.message}
          </p>
        )}
      </div>

      <Input
        id="requesterStart"
        label="Entrada"
        type="datetime-local"
        error={errors.requesterStart?.message}
        {...register("requesterStart")}
      />

      <Input
        id="requesterEnd"
        label="Salida"
        type="datetime-local"
        error={errors.requesterEnd?.message}
        {...register("requesterEnd")}
        onChange={(e) => {
          userEditedEnd.current = true;
          register("requesterEnd").onChange(e);
        }}
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="absenceReasonId"
          className="text-sm font-medium text-brand-800"
        >
          Motivo
        </label>
        <select
          id="absenceReasonId"
          aria-invalid={errors.absenceReasonId ? true : undefined}
          className={selectClass(Boolean(errors.absenceReasonId))}
          {...register("absenceReasonId")}
        >
          <option value="">Seleccioná un motivo</option>
          {selectableReasons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.absenceReasonId && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.absenceReasonId.message}
          </p>
        )}
      </div>

      {showObservation && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="observation"
            className="text-sm font-medium text-brand-800"
          >
            Observación
          </label>
          <textarea
            id="observation"
            rows={3}
            maxLength={500}
            aria-invalid={errors.observation ? true : undefined}
            className={selectClass(Boolean(errors.observation))}
            {...register("observation")}
          />
          {errors.observation && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.observation.message}
            </p>
          )}
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

      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Solicitar ausencia
      </Button>
    </form>
  );
}
