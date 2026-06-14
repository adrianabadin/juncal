"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { assignCompulsorySchema } from "@shift-replacements/domain/schemas/shift-replacement.schema";
import { assignCompulsoryAction } from "@shift-replacements/presentation/actions/shiftActions";
import {
  listUsersBySpecialtyAction,
  UserOptionDto,
} from "@users/presentation/actions/userAdminActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

// El form usa string para la fecha; la server action coacciona con z.coerce.date()
const formSchema = assignCompulsorySchema.extend({
  date: z.string().min(1, "Requerido"),
});
type FormInput = z.infer<typeof formSchema>;

interface SpecialtyOption {
  id: string;
  name: string;
}

interface AssignCompulsoryFormProps {
  specialties: SpecialtyOption[];
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
    defaultValues: { specialtyId: "", requesterId: "", applicantId: "" },
  });

  const specialtyId = watch("specialtyId");
  const requesterId = watch("requesterId");

  // Al cambiar la especialidad, recargar los médicos y limpiar la selección.
  useEffect(() => {
    let active = true;
    setValue("requesterId", "");
    setValue("applicantId", "");

    if (!specialtyId) {
      setDoctors([]);
      return;
    }

    setLoadingDoctors(true);
    listUsersBySpecialtyAction(specialtyId).then((res) => {
      if (!active) return;
      setDoctors(res.ok ? (res.data ?? []) : []);
      setLoadingDoctors(false);
    });

    return () => {
      active = false;
    };
  }, [specialtyId, setValue]);

  // El reemplazante no puede ser el mismo que el solicitante.
  useEffect(() => {
    if (requesterId && watch("applicantId") === requesterId) {
      setValue("applicantId", "");
    }
  }, [requesterId, setValue, watch]);

  async function onSubmit(data: FormInput) {
    const result = await assignCompulsoryAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.refresh();
  }

  const applicantOptions = doctors.filter((d) => d.id !== requesterId);
  const specialtyChosen = Boolean(specialtyId);
  const noDoctors = specialtyChosen && !loadingDoctors && doctors.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="date"
        label="Fecha"
        type="date"
        error={errors.date?.message}
        {...register("date")}
      />

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

      {noDoctors && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          No hay profesionales activos con esta especialidad.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="requesterId"
          className="text-sm font-medium text-brand-800"
        >
          Solicitante (profesional ausente)
        </label>
        <select
          id="requesterId"
          disabled={!specialtyChosen || loadingDoctors || doctors.length === 0}
          aria-invalid={errors.requesterId ? true : undefined}
          className={selectClass(Boolean(errors.requesterId))}
          {...register("requesterId")}
        >
          <option value="">
            {loadingDoctors
              ? "Cargando profesionales…"
              : "Seleccioná al profesional ausente"}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.email})
            </option>
          ))}
        </select>
        {errors.requesterId && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.requesterId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="applicantId"
          className="text-sm font-medium text-brand-800"
        >
          Reemplazante (asignado)
        </label>
        <select
          id="applicantId"
          disabled={!requesterId || applicantOptions.length === 0}
          aria-invalid={errors.applicantId ? true : undefined}
          className={selectClass(Boolean(errors.applicantId))}
          {...register("applicantId")}
        >
          <option value="">
            {requesterId
              ? "Seleccioná al reemplazante"
              : "Elegí primero al solicitante"}
          </option>
          {applicantOptions.map((d) => (
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

      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} disabled={noDoctors}>
        Asignar reemplazo compulsivo
      </Button>
    </form>
  );
}
