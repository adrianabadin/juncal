"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createSpecialtySchema,
  CreateSpecialtyInput,
} from "@specialties/domain/schemas/specialty.schema";
import {
  createSpecialtyAction,
  SpecialtyDto,
} from "@specialties/presentation/actions/specialtyActions";
import { ActionResult } from "@shared/presentation/ActionResult";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyFormProps {
  // Permite inyectar un handler optimista; por defecto llama a la server action.
  onSubmitCreate?: (
    data: CreateSpecialtyInput,
  ) => Promise<ActionResult<SpecialtyDto>>;
}

export default function SpecialtyForm({ onSubmitCreate }: SpecialtyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSpecialtyInput>({
    resolver: zodResolver(createSpecialtySchema),
  });

  async function onSubmit(data: CreateSpecialtyInput) {
    const submit = onSubmitCreate ?? createSpecialtyAction;
    const result = await submit(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="name"
        label="Nombre"
        type="text"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        id="description"
        label="Descripción (opcional)"
        type="text"
        error={errors.description?.message}
        {...register("description")}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Crear especialidad
      </Button>
    </form>
  );
}
