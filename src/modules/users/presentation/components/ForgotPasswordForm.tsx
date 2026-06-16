"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordAction } from "@users/presentation/actions/authActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

const schema = z.object({ email: z.string().email("Email inválido") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const result = await forgotPasswordAction(data.email);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md bg-sage-50 p-4 text-sm text-sage-800 ring-1 ring-sage-200">
        Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input id="email" label="Email" type="email" error={errors.email?.message} {...register("email")} />
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" isLoading={isSubmitting}>Enviar enlace de recuperación</Button>
    </form>
  );
}
