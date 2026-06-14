"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import { activateUserSchema } from "@users/domain/schemas/user.schema";
import { Role } from "@users/domain/enums/Role";
import { ActivateUserWithSpecialties } from "@users/application/use-cases/ActivateUserWithSpecialties";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";
import { getCurrentActor } from "@users/presentation/session";

export interface InactiveUserDto {
  id: string;
  email: string;
  name: string;
}

export async function activateUserAction(input: unknown): Promise<ActionResult> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = activateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaUserRepository();
  const uc = new ActivateUserWithSpecialties(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    userId: parsed.data.userId,
    specialtyIds: parsed.data.specialtyIds,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

export async function listInactiveUsersAction(): Promise<ActionResult<InactiveUserDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR) return { ok: false, error: "Acceso denegado" };

  const repo = new PrismaUserRepository();
  const users = await repo.listInactive();

  const data: InactiveUserDto[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
  }));

  return { ok: true, data };
}
