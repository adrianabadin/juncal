"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@users/presentation/actions/authActions";
import Button from "@shared/presentation/ui/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <Button variant="secondary" onClick={handleLogout}>
      Cerrar sesión
    </Button>
  );
}
