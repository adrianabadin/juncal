"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAbsenceReasonSchema,
  CreateAbsenceReasonInput,
} from "@absence-reasons/domain/schemas/absence-reason.schema";
import { createAbsenceReasonAction } from "@absence-reasons/presentation/actions/absenceReasonActions";
import { AbsenceReasonDto } from "@absence-reasons/presentation/actions/absenceReasonDto";
import { ActionResult } from "@shared/presentation/ActionResult";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

interface AbsenceReasonFormProps {
  onSubmitCreate?: (
    data: CreateAbsenceReasonInput,
  ) => Promise<ActionResult<AbsenceReasonDto>>;
}

export default function AbsenceReasonForm({
  onSubmitCreate,
}: AbsenceReasonFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAbsenceReasonInput>({
    resolver: zodResolver(createAbsenceReasonSchema),
  });

  async function onSubmit(data: CreateAbsenceReasonInput) {
    const submit = onSubmitCreate ?? createAbsenceReasonAction;
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
      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Crear motivo
      </Button>
    </form>
  );
}
