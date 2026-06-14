"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  activateUserSchema,
  ActivateUserInput,
} from "@users/domain/schemas/user.schema";
import { activateUserAction } from "@users/presentation/actions/userAdminActions";
import Button from "@shared/presentation/ui/Button";

interface SpecialtyOption {
  id: string;
  name: string;
}

interface ActivateUserFormProps {
  userId: string;
  specialties: SpecialtyOption[];
}

export default function ActivateUserForm({
  userId,
  specialties,
}: ActivateUserFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ActivateUserInput>({
    resolver: zodResolver(activateUserSchema),
    defaultValues: { userId, specialtyIds: [] },
  });

  async function onSubmit(data: ActivateUserInput) {
    const result = await activateUserAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <input type="hidden" value={userId} {...register("userId")} />
      <fieldset>
        <legend className="text-sm font-medium text-brand-800 mb-2">
          Especialidades
        </legend>
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
      <Button type="submit" isLoading={isSubmitting} variant="primary">
        Activar usuario
      </Button>
    </form>
  );
}
