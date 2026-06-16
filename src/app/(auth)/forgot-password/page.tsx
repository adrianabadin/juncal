import Card from "@shared/presentation/ui/Card";
import ForgotPasswordForm from "@users/presentation/components/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-brand-800">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-link hover:underline">Volver al login</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
