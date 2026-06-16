import { Suspense } from "react";
import Card from "@shared/presentation/ui/Card";
import ResetPasswordForm from "@users/presentation/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-brand-800">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá tu nueva contraseña.
            </p>
          </div>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
