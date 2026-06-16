"use server";

import argon2 from "argon2";
import { ActionResult } from "@shared/presentation/ActionResult";
import { registerUserSchema, loginSchema } from "@users/domain/schemas/user.schema";
import { RegisterUser } from "@users/application/use-cases/RegisterUser";
import { AuthenticateUser } from "@users/application/use-cases/AuthenticateUser";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";
import { createSession, destroySession, getCurrentActor } from "@users/presentation/session";
import { ForgotPassword } from "@users/application/use-cases/ForgotPassword";
import { ResetPassword } from "@users/application/use-cases/ResetPassword";
import { ChangePassword } from "@users/application/use-cases/ChangePassword";

export async function registerUserAction(input: unknown): Promise<ActionResult> {
  const parsed = registerUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaUserRepository();
  const uc = new RegisterUser(repo, (plain) => argon2.hash(plain));
  const result = await uc.execute(parsed.data);

  if (!result.isOk) {
    if (result.error.code === "EMAIL_TAKEN") {
      return { ok: false, error: "No se pudo completar el registro" };
    }
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaUserRepository();
  const uc = new AuthenticateUser(repo, (plain, hash) => argon2.verify(hash, plain));
  const result = await uc.execute(parsed.data);

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  await createSession(result.value.id);
  return { ok: true };
}

export async function logoutAction(): Promise<ActionResult> {
  await destroySession();
  return { ok: true };
}

export async function forgotPasswordAction(
  email: string,
): Promise<ActionResult<{ sent: boolean }>> {
  const repo = new PrismaUserRepository();
  const uc = new ForgotPassword(repo);
  const result = await uc.execute(email);

  if (!result.isOk) return { ok: false, error: result.error.message };

  if (result.value.token) {
    const { sendForgotPasswordEmail } = await import("@/modules/emails/sendEmail");
    const user = await repo.findByEmail(email);
    if (user) {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${result.value.token}`;
      await sendForgotPasswordEmail(email, user.name, resetUrl);
    }
  }

  return { ok: true, data: { sent: true } };
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  const repo = new PrismaUserRepository();
  const uc = new ResetPassword(repo, (plain) => argon2.hash(plain));
  const result = await uc.execute(token, newPassword);

  if (!result.isOk) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaUserRepository();
  const uc = new ChangePassword(
    repo,
    (hash, plain) => argon2.verify(hash, plain),
    (plain) => argon2.hash(plain),
  );
  const result = await uc.execute(actor.userId, currentPassword, newPassword);

  if (!result.isOk) return { ok: false, error: result.error.message };
  return { ok: true };
}
