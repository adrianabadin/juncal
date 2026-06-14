import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import LoginForm from "@users/presentation/components/LoginForm";
import Logo from "@shared/presentation/ui/Logo";

export default async function LoginPage() {
  const actor = await getCurrentActor();
  if (actor) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo height={64} priority />
          <div>
            <h1 className="text-xl font-semibold text-brand-800">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestión de Guardias — Sanatorio Juncal
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-link hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
