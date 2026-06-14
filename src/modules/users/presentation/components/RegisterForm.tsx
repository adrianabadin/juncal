"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerUserSchema,
  RegisterUserInput,
} from "@users/domain/schemas/user.schema";
import { registerUserAction } from "@users/presentation/actions/authActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

export default function RegisterForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterUserInput>({
    resolver: zodResolver(registerUserSchema),
  });

  async function onSubmit(data: RegisterUserInput) {
    const result = await registerUserAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    setSuccessMessage("Cuenta creada. Un coordinador debe activarla.");
  }

  if (successMessage) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="name"
        label="Nombre"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Crear cuenta
      </Button>
    </form>
  );
}
