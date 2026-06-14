"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@users/presentation/actions/authActions";
import Button from "@shared/presentation/ui/Button";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await logoutAction();
      if (!result.ok) {
        // Session destruction failed but we still navigate away for safety
        console.error("Logout action returned error:", result.error);
      }
    } catch (err) {
      console.error("Logout action threw:", err);
    } finally {
      router.push("/login");
    }
  }

  return (
    <Button variant="secondary" isLoading={isLoading} onClick={handleLogout}>
      Cerrar sesión
    </Button>
  );
}
