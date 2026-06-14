import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import LoginForm from "@users/presentation/components/LoginForm";

export default async function LoginPage() {
  const actor = await getCurrentActor();
  if (actor) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ingresá a tu cuenta de Juncal
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
