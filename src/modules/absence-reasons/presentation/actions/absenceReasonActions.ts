"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import {
  createAbsenceReasonSchema,
  updateAbsenceReasonSchema,
  deleteAbsenceReasonSchema,
} from "@absence-reasons/domain/schemas/absence-reason.schema";
import { Role } from "@users/domain/enums/Role";
import { CreateAbsenceReason } from "@absence-reasons/application/use-cases/CreateAbsenceReason";
import { UpdateAbsenceReason } from "@absence-reasons/application/use-cases/UpdateAbsenceReason";
import { DeactivateAbsenceReason } from "@absence-reasons/application/use-cases/DeactivateAbsenceReason";
import { DeleteAbsenceReason } from "@absence-reasons/application/use-cases/DeleteAbsenceReason";
import { ListAbsenceReasons } from "@absence-reasons/application/use-cases/ListAbsenceReasons";
import { PrismaAbsenceReasonRepository } from "@absence-reasons/infrastructure/persistence/PrismaAbsenceReasonRepository";
import {
  AbsenceReasonDto,
  toAbsenceReasonDto,
} from "@absence-reasons/presentation/actions/absenceReasonDto";
import { getCurrentActor } from "@users/presentation/session";

export type { AbsenceReasonDto };

export async function createAbsenceReasonAction(
  input: unknown,
): Promise<ActionResult<AbsenceReasonDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = createAbsenceReasonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaAbsenceReasonRepository();
  const uc = new CreateAbsenceReason(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    name: parsed.data.name,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, data: toAbsenceReasonDto(result.value) };
}

export async function updateAbsenceReasonAction(
  input: unknown,
): Promise<ActionResult<AbsenceReasonDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = updateAbsenceReasonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaAbsenceReasonRepository();
  const uc = new UpdateAbsenceReason(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    id: parsed.data.id,
    name: parsed.data.name,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, data: toAbsenceReasonDto(result.value) };
}

export async function deactivateAbsenceReasonAction(
  input: unknown,
): Promise<ActionResult<AbsenceReasonDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = deleteAbsenceReasonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaAbsenceReasonRepository();
  const uc = new DeactivateAbsenceReason(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    id: parsed.data.id,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, data: toAbsenceReasonDto(result.value) };
}

export async function deleteAbsenceReasonAction(
  input: unknown,
): Promise<ActionResult> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = deleteAbsenceReasonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaAbsenceReasonRepository();
  const uc = new DeleteAbsenceReason(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    id: parsed.data.id,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

export async function listAbsenceReasonsAction(): Promise<
  ActionResult<AbsenceReasonDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaAbsenceReasonRepository();
  const uc = new ListAbsenceReasons(repo);
  const reasons = await uc.execute();

  return { ok: true, data: reasons.map(toAbsenceReasonDto) };
}

export async function listActiveAbsenceReasonsAction(): Promise<
  ActionResult<AbsenceReasonDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaAbsenceReasonRepository();
  const reasons = await repo.listActive();

  return { ok: true, data: reasons.map(toAbsenceReasonDto) };
}
