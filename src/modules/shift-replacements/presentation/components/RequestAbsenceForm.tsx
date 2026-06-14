"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestAbsenceSchema } from "@shift-replacements/domain/schemas/shift-replacement.schema";
import { requestAbsenceAction } from "@shift-replacements/presentation/actions/shiftActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

// Form uses string for date field; the server action (which calls requestAbsenceSchema
// with z.coerce.date()) handles coercion server-side.
const formSchema = requestAbsenceSchema.extend({ date: z.string().min(1, "Requerido") });
type FormInput = z.infer<typeof formSchema>;

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RequestAbsenceFormProps {
  specialties: SpecialtyOption[];
}

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
      <Input
        id="date"
        label="Fecha de ausencia"
        type="date"
        error={errors.date?.message}
        {...register("date")}
      />
      <div className="flex flex-col gap-1">
        <label
          htmlFor="specialtyId"
          className="text-sm font-medium text-slate-700"
        >
          Especialidad
        </label>
        <select
          id="specialtyId"
          aria-invalid={errors.specialtyId ? true : undefined}
          className={[
            "w-full rounded-md border px-3 py-2 text-base text-slate-900 min-h-11 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600",
            errors.specialtyId
              ? "border-red-500"
              : "border-slate-300",
          ]
            .filter(Boolean)
            .join(" ")}
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
