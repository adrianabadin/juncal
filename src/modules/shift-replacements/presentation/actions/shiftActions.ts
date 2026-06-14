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
import { prisma } from "@shared/infrastructure/prisma/client";

export interface ShiftDto {
  id: string;
  date: string;
  state: string;
  specialtyId: string;
  requesterId: string;
  applicantId: string | null;
}

export interface PostulatedShiftDto extends ShiftDto {
  requesterName: string;
  applicantName: string | null;
}

function mapShiftToDto(s: { id: string; date: Date; state: string; specialtyId: string; requesterId: string; applicantId: string | null }): ShiftDto {
  return {
    id: s.id,
    date: s.date.toISOString(),
    state: s.state,
    specialtyId: s.specialtyId,
    requesterId: s.requesterId,
    applicantId: s.applicantId,
  };
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

  return { ok: true, data: mapShiftToDto(result.value) };
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

  return { ok: true, data: mapShiftToDto(result.value) };
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

  return { ok: true, data: mapShiftToDto(result.value) };
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

  return { ok: true, data: mapShiftToDto(result.value) };
}

export async function listOpenBySpecialtyAction(specialtyId: string): Promise<ActionResult<ShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listOpenBySpecialty(specialtyId);

  return { ok: true, data: shifts.map(mapShiftToDto) };
}

export async function listPostulatedAction(): Promise<ActionResult<PostulatedShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR) return { ok: false, error: "No autorizado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.POSTULATED);

  // Batch-fetch all relevant user names in a single query
  const userIds = [
    ...new Set([
      ...shifts.map((s) => s.requesterId),
      ...shifts.flatMap((s) => (s.applicantId ? [s.applicantId] : [])),
    ]),
  ];

  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];

  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return {
    ok: true,
    data: shifts.map((s) => ({
      ...mapShiftToDto(s),
      requesterName: nameById.get(s.requesterId) ?? s.requesterId,
      applicantName: s.applicantId ? (nameById.get(s.applicantId) ?? s.applicantId) : null,
    })),
  };
}
