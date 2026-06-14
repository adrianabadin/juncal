"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { assignCompulsoryCoverageSchema } from "@shift-replacements/domain/schemas/shift-replacement.schema";
import { assignCompulsoryCoverageAction } from "@shift-replacements/presentation/actions/shiftActions";
import {
  listUsersBySpecialtyAction,
  UserOptionDto,
} from "@users/presentation/actions/userAdminActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

const formSchema = z.object({
  shiftId: z.string().min(1, "Requerido"),
  applicantId: z.string().min(1, "Requerido"),
  start: z.string().min(1, "Requerido"),
  end: z.string().min(1, "Requerido"),
});
type FormInput = z.infer<typeof formSchema>;

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
}

const selectClass = (hasError: boolean): string =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-base text-slate-900 min-h-11 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    hasError ? "border-red-500" : "border-slate-300",
  ].join(" ");

export default function AssignCompulsoryForm({
  specialties,
  openShifts,
}: AssignCompulsoryFormProps) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<UserOptionDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { shiftId: "", applicantId: "", start: "", end: "" },
  });

  const shiftId = watch("shiftId");
  const selectedShift = openShifts.find((s) => s.id === shiftId);

  // When a shift is selected, load doctors for its specialty and set default times
  useEffect(() => {
    let active = true;
    setValue("applicantId", "");

    if (!selectedShift) {
      setDoctors([]);
      setValue("start", "");
      setValue("end", "");
      return;
    }

    // Set default start/end from the shift window
    setValue("start", selectedShift.requesterStart.slice(0, 16));
    setValue("end", selectedShift.requesterEnd.slice(0, 16));

    setLoadingDoctors(true);
    listUsersBySpecialtyAction(selectedShift.specialtyId).then((res) => {
      if (!active) return;
      setDoctors(res.ok ? (res.data ?? []) : []);
      setLoadingDoctors(false);
    });

    return () => {
      active = false;
    };
  }, [selectedShift, setValue]);

  async function onSubmit(data: FormInput) {
    const result = await assignCompulsoryCoverageAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.refresh();
  }

  const hasShift = Boolean(selectedShift);
  const noDoctors = hasShift && !loadingDoctors && doctors.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="shiftId"
          className="text-sm font-medium text-brand-800"
        >
          Solicitud abierta
        </label>
        <select
          id="shiftId"
          aria-invalid={errors.shiftId ? true : undefined}
          className={selectClass(Boolean(errors.shiftId))}
          {...register("shiftId")}
        >
          <option value="">Seleccioná una solicitud</option>
          {openShifts.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.requesterStart).toLocaleDateString("es-AR")} —{" "}
              {specialties.find((sp) => sp.id === s.specialtyId)?.name ?? s.specialtyId}
            </option>
          ))}
        </select>
        {errors.shiftId && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.shiftId.message}
          </p>
        )}
      </div>

      {noDoctors && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          No hay profesionales activos con esta especialidad.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="applicantId"
          className="text-sm font-medium text-brand-800"
        >
          Profesional a asignar
        </label>
        <select
          id="applicantId"
          disabled={!hasShift || loadingDoctors || doctors.length === 0}
          aria-invalid={errors.applicantId ? true : undefined}
          className={selectClass(Boolean(errors.applicantId))}
          {...register("applicantId")}
        >
          <option value="">
            {loadingDoctors
              ? "Cargando profesionales…"
              : "Seleccioná al profesional"}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.email})
            </option>
          ))}
        </select>
        {errors.applicantId && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.applicantId.message}
          </p>
        )}
      </div>

      <Input
        id="start"
        label="Entrada"
        type="datetime-local"
        error={errors.start?.message}
        {...register("start")}
      />

      <Input
        id="end"
        label="Salida"
        type="datetime-local"
        error={errors.end?.message}
        {...register("end")}
      />

      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} disabled={noDoctors}>
        Asignar cobertura compulsiva
      </Button>
    </form>
  );
}
