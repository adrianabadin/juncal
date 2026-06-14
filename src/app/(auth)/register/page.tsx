import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@users/presentation/session";
import RegisterForm from "@users/presentation/components/RegisterForm";

export default async function RegisterPage() {
  const actor = await getCurrentActor();
  if (actor) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registrate en Juncal
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
