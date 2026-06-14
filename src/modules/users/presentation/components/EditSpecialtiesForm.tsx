"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateSpecialtiesSchema,
  UpdateSpecialtiesInput,
} from "@users/domain/schemas/user.schema";
import {
  updateUserSpecialtiesAction,
  getUserSpecialtyIdsAction,
} from "@users/presentation/actions/userAdminActions";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface EditSpecialtiesFormProps {
  userId: string;
  userName: string;
  specialties: SpecialtyOption[];
  onUpdated?: (userId: string, specialtyIds: string[]) => void;
}

export default function EditSpecialtiesForm({
  userId,
  userName,
  specialties,
  onUpdated,
}: EditSpecialtiesFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentIds, setCurrentIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSpecialtiesInput>({
    resolver: zodResolver(updateSpecialtiesSchema),
    defaultValues: { userId, specialtyIds: [] },
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getUserSpecialtyIdsAction(userId).then((res) => {
      const ids = res.ok ? (res.data ?? []) : [];
      setCurrentIds(ids);
      reset({ userId, specialtyIds: ids });
      setLoading(false);
    });
  }, [isOpen, userId, reset]);

  async function onSubmit(data: UpdateSpecialtiesInput) {
    const result = await updateUserSpecialtiesAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    onUpdated?.(userId, data.specialtyIds);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Editar especialidades
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
      <p className="mb-3 text-sm font-medium text-brand-800">
        Especialidades de {userName}
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <input type="hidden" value={userId} {...register("userId")} />
          <fieldset>
            <div className="flex flex-col gap-1">
              {specialties.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={s.id}
                    {...register("specialtyIds")}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {errors.specialtyIds && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {errors.specialtyIds.message}
              </p>
            )}
          </fieldset>
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
              variant="secondary"
              onClick={() => {
                setIsOpen(false);
                reset({ userId, specialtyIds: currentIds });
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
