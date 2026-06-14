"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateSpecialtySchema,
  UpdateSpecialtyInput,
} from "@specialties/domain/schemas/specialty.schema";
import {
  updateSpecialtyAction,
  deleteSpecialtyAction,
  SpecialtyDto,
} from "@specialties/presentation/actions/specialtyActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyActionsProps {
  id: string;
  name: string;
  description: string | null;
  onUpdated: (dto: SpecialtyDto) => void;
  onDeleted: (id: string) => void;
}

export default function SpecialtyActions({
  id,
  name,
  description,
  onUpdated,
  onDeleted,
}: SpecialtyActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSpecialtyInput>({
    resolver: zodResolver(updateSpecialtySchema),
    defaultValues: { id, name, description: description ?? "" },
  });

  async function onUpdate(data: UpdateSpecialtyInput) {
    const result = await updateSpecialtyAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    setIsEditing(false);
    if (result.data) onUpdated(result.data);
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteSpecialtyAction({ id });
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    onDeleted(id);
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-3 mt-3">
        <input type="hidden" {...register("id")} />
        <Input
          id={`name-${id}`}
          label="Nombre"
          type="text"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          id={`description-${id}`}
          label="Descripción"
          type="text"
          error={errors.description?.message}
          {...register("description")}
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
      <div className="flex gap-2 mt-2">
        <Button
          variant="secondary"
          onClick={() => setIsEditing(true)}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          isLoading={isDeleting}
          onClick={handleDelete}
        >
          Eliminar
        </Button>
      </div>
      {deleteError && (
        <p role="alert" className="text-sm text-red-600">
          {deleteError}
        </p>
      )}
    </div>
  );
}
