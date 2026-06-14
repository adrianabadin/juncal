"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestAbsenceAction } from "@shift-replacements/presentation/actions/shiftActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

const formSchema = z.object({
  specialtyId: z.string().min(1, "Requerido"),
  moduleHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  requesterStart: z.string().min(1, "Requerido"),
  requesterEnd: z.string().min(1, "Requerido"),
});
type FormInput = z.infer<typeof formSchema>;

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RequestAbsenceFormProps {
  specialties: SpecialtyOption[];
}

const selectClass = (hasError: boolean): string =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-base text-slate-900 min-h-11 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500",
    hasError ? "border-red-500" : "border-slate-300",
  ].join(" ");

export default function RequestAbsenceForm({
  specialties,
}: RequestAbsenceFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { moduleHours: 12 },
  });

  async function onSubmit(data: FormInput) {
    const result = await requestAbsenceAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.refresh();
  }

  return (
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
      />

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
