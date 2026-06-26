"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateAbsenceReasonSchema,
  UpdateAbsenceReasonInput,
} from "@absence-reasons/domain/schemas/absence-reason.schema";
import {
  updateAbsenceReasonAction,
  deactivateAbsenceReasonAction,
  deleteAbsenceReasonAction,
  AbsenceReasonDto,
} from "@absence-reasons/presentation/actions/absenceReasonActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

interface AbsenceReasonActionsProps {
  id: string;
  name: string;
  isDefault: boolean;
  onUpdated: (dto: AbsenceReasonDto) => void;
  onDeleted: (id: string) => void;
}

export default function AbsenceReasonActions({
  id,
  name,
  isDefault,
  onUpdated,
  onDeleted,
}: AbsenceReasonActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAbsenceReasonInput>({
    resolver: zodResolver(updateAbsenceReasonSchema),
    defaultValues: { id, name },
  });

  async function onUpdate(data: UpdateAbsenceReasonInput) {
    const result = await updateAbsenceReasonAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    setIsEditing(false);
    if (result.data) onUpdated(result.data);
  }

  async function handleDeactivate() {
    setIsBusy(true);
    setActionError(null);
    const result = await deactivateAbsenceReasonAction({ id });
    setIsBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    if (result.data) onUpdated(result.data);
  }

  async function handleDelete() {
    setIsBusy(true);
    setActionError(null);
    const result = await deleteAbsenceReasonAction({ id });
    setIsBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    onDeleted(id);
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onUpdate)}
        className="mt-3 flex flex-col gap-3"
      >
        <input type="hidden" {...register("id")} />
        <Input
          id={`name-${id}`}
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
        <div className="flex gap-2">
          <Button type="submit" isLoading={isSubmitting}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
        <Button variant="secondary" isLoading={isBusy} onClick={handleDeactivate}>
          Desactivar
        </Button>
        {!isDefault && (
          <Button variant="danger" isLoading={isBusy} onClick={handleDelete}>
            Eliminar
          </Button>
        )}
      </div>
      {actionError && (
        <p role="alert" className="text-sm text-red-600">
          {actionError}
        </p>
      )}
    </div>
  );
}
