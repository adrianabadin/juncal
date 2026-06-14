"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import { createSpecialtySchema, updateSpecialtySchema } from "@specialties/domain/schemas/specialty.schema";
import { Role } from "@users/domain/enums/Role";
import { CreateSpecialty } from "@specialties/application/use-cases/CreateSpecialty";
import { UpdateSpecialty } from "@specialties/application/use-cases/UpdateSpecialty";
import { DeleteSpecialty } from "@specialties/application/use-cases/DeleteSpecialty";
import { ListSpecialties } from "@specialties/application/use-cases/ListSpecialties";
import { PrismaSpecialtyRepository } from "@specialties/infrastructure/persistence/PrismaSpecialtyRepository";
import { getCurrentActor } from "@users/presentation/session";

export interface SpecialtyDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function createSpecialtyAction(input: unknown): Promise<ActionResult<SpecialtyDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = createSpecialtySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaSpecialtyRepository();
  const uc = new CreateSpecialty(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return { ok: true, data: { id: s.id, name: s.name, description: s.description, isActive: s.isActive } };
}

export async function updateSpecialtyAction(input: unknown): Promise<ActionResult<SpecialtyDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = updateSpecialtySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaSpecialtyRepository();
  const uc = new UpdateSpecialty(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    id: parsed.data.id,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return { ok: true, data: { id: s.id, name: s.name, description: s.description, isActive: s.isActive } };
}

export async function deleteSpecialtyAction(input: unknown): Promise<ActionResult> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = updateSpecialtySchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaSpecialtyRepository();
  const uc = new DeleteSpecialty(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    id: parsed.data.id,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

export async function listSpecialtiesAction(): Promise<ActionResult<SpecialtyDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaSpecialtyRepository();
  const uc = new ListSpecialties(repo);
  const specialties = await uc.execute();

  const data: SpecialtyDto[] = specialties.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
  }));

  return { ok: true, data };
}
