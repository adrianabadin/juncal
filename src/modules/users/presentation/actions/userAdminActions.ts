"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import {
  activateUserSchema,
  changeUserRoleSchema,
} from "@users/domain/schemas/user.schema";
import { Role } from "@users/domain/enums/Role";
import { ActivateUserWithSpecialties } from "@users/application/use-cases/ActivateUserWithSpecialties";
import { ChangeUserRole } from "@users/application/use-cases/ChangeUserRole";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";
import { getCurrentActor } from "@users/presentation/session";

export interface InactiveUserDto {
  id: string;
  email: string;
  name: string;
}

export interface UserOptionDto {
  id: string;
  name: string;
  email: string;
}

export interface ActiveUserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
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

export async function listActiveUsersAction(): Promise<
  ActionResult<ActiveUserDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR)
    return { ok: false, error: "Acceso denegado" };

  const repo = new PrismaUserRepository();
  const users = await repo.listActive();

  const data: ActiveUserDto[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  return { ok: true, data };
}

export async function changeUserRoleAction(
  input: unknown,
): Promise<ActionResult<ActiveUserDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = changeUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaUserRepository();
  const uc = new ChangeUserRole(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    actorId: actor.userId,
    userId: parsed.data.userId,
    role: parsed.data.role,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const u = result.value;
  return {
    ok: true,
    data: { id: u.id, name: u.name, email: u.email, role: u.role },
  };
}

export async function listUsersBySpecialtyAction(
  specialtyId: unknown,
): Promise<ActionResult<UserOptionDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR)
    return { ok: false, error: "Acceso denegado" };
  if (typeof specialtyId !== "string" || specialtyId.length === 0)
    return { ok: false, error: "Especialidad inválida" };

  const repo = new PrismaUserRepository();
  const users = await repo.listActiveBySpecialty(specialtyId);

  const data: UserOptionDto[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));

  return { ok: true, data };
}
