"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@users/domain/schemas/user.schema";
import { loginAction } from "@users/presentation/actions/authActions";
import Input from "@shared/presentation/ui/Input";
import Button from "@shared/presentation/ui/Button";

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const result = await loginAction(data);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-xs text-link hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Ingresar
      </Button>
    </form>
  );
}
