"use server";

import argon2 from "argon2";
import { ActionResult } from "@shared/presentation/ActionResult";
import { registerUserSchema, loginSchema } from "@users/domain/schemas/user.schema";
import { RegisterUser } from "@users/application/use-cases/RegisterUser";
import { AuthenticateUser } from "@users/application/use-cases/AuthenticateUser";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";
import { createSession, destroySession } from "@users/presentation/session";

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
