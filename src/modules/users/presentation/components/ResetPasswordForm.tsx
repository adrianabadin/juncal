"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordAction } from "@users/presentation/actions/authActions";
import PasswordInput from "@shared/presentation/ui/PasswordInput";
import Button from "@shared/presentation/ui/Button";
import { useToast } from "@shared/presentation/ui/Toast";

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) return <p className="text-sm text-red-600">Token inválido.</p>;

  async function onSubmit(data: FormData) {
    const result = await resetPasswordAction(token!, data.password);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    toast("Contraseña restablecida exitosamente", "success");
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <PasswordInput id="password" label="Nueva contraseña" error={errors.password?.message} {...register("password")} />
      <PasswordInput id="confirm" label="Confirmar contraseña" error={errors.confirm?.message} {...register("confirm")} />
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <Button type="submit" isLoading={isSubmitting}>Restablecer contraseña</Button>
    </form>
  );
}
