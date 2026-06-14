"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import {
  requestAbsenceSchema,
  postulateSchema,
  resolveReplacementSchema,
  assignCompulsorySchema,
} from "@shift-replacements/domain/schemas/shift-replacement.schema";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { Role } from "@users/domain/enums/Role";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { PostulateForReplacement } from "@shift-replacements/application/use-cases/PostulateForReplacement";
import { ResolveReplacement } from "@shift-replacements/application/use-cases/ResolveReplacement";
import { AssignCompulsoryReplacement } from "@shift-replacements/application/use-cases/AssignCompulsoryReplacement";
import { PrismaShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository";
import { prismaHasSpecialty } from "@users/infrastructure/persistence/prismaHasSpecialty";
import { getCurrentActor } from "@users/presentation/session";

export interface ShiftDto {
  id: string;
  date: string;
  state: string;
  specialtyId: string;
  requesterId: string;
  applicantId: string | null;
}

export async function requestAbsenceAction(input: unknown): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = requestAbsenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new RequestAbsence(repo, prismaHasSpecialty);
  const result = await uc.execute({
    requesterId: actor.userId,
    isActive: actor.isActive,
    date: parsed.data.date,
    specialtyId: parsed.data.specialtyId,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return {
    ok: true,
    data: {
      id: s.id,
      date: s.date.toISOString(),
      state: s.state,
      specialtyId: s.specialtyId,
      requesterId: s.requesterId,
      applicantId: s.applicantId,
    },
  };
}

export async function postulateAction(input: unknown): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = postulateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new PostulateForReplacement(repo, prismaHasSpecialty);
  const result = await uc.execute({
    shiftId: parsed.data.shiftId,
    applicantId: actor.userId,
    isActive: actor.isActive,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return {
    ok: true,
    data: {
      id: s.id,
      date: s.date.toISOString(),
      state: s.state,
      specialtyId: s.specialtyId,
      requesterId: s.requesterId,
      applicantId: s.applicantId,
    },
  };
}

export async function resolveReplacementAction(input: unknown): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = resolveReplacementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new ResolveReplacement(repo);
  const result = await uc.execute({
    shiftId: parsed.data.shiftId,
    action: parsed.data.action,
    coordinatorId: actor.userId,
    actorIsCoordinator: actor.role === Role.COORDINATOR,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return {
    ok: true,
    data: {
      id: s.id,
      date: s.date.toISOString(),
      state: s.state,
      specialtyId: s.specialtyId,
      requesterId: s.requesterId,
      applicantId: s.applicantId,
    },
  };
}

export async function assignCompulsoryAction(input: unknown): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = assignCompulsorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new AssignCompulsoryReplacement(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    coordinatorId: actor.userId,
    date: parsed.data.date,
    specialtyId: parsed.data.specialtyId,
    requesterId: parsed.data.requesterId,
    applicantId: parsed.data.applicantId,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const s = result.value;
  return {
    ok: true,
    data: {
      id: s.id,
      date: s.date.toISOString(),
      state: s.state,
      specialtyId: s.specialtyId,
      requesterId: s.requesterId,
      applicantId: s.applicantId,
    },
  };
}

export async function listOpenBySpecialtyAction(specialtyId: string): Promise<ActionResult<ShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listOpenBySpecialty(specialtyId);

  const data: ShiftDto[] = shifts.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    state: s.state,
    specialtyId: s.specialtyId,
    requesterId: s.requesterId,
    applicantId: s.applicantId,
  }));

  return { ok: true, data };
}

export async function listPostulatedAction(): Promise<ActionResult<ShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.POSTULATED);

  const data: ShiftDto[] = shifts.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    state: s.state,
    specialtyId: s.specialtyId,
    requesterId: s.requesterId,
    applicantId: s.applicantId,
  }));

  return { ok: true, data };
}
