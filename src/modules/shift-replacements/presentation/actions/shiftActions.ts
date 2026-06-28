"use server";

import { ActionResult } from "@shared/presentation/ActionResult";
import {
  requestAbsenceSchema,
  postulateSchema,
  resolveRequestSchema,
  assignCompulsoryCoverageSchema,
  removeCoverageSchema,
  createCompulsorySchema,
} from "@shift-replacements/domain/schemas/shift-replacement.schema";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { Role } from "@users/domain/enums/Role";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { PostulateForReplacement } from "@shift-replacements/application/use-cases/PostulateForReplacement";
import { ResolveRequest } from "@shift-replacements/application/use-cases/ResolveRequest";
import { CreateCompulsoryReplacement } from "@shift-replacements/application/use-cases/CreateCompulsoryReplacement";
import { AssignCompulsoryCoverage } from "@shift-replacements/application/use-cases/AssignCompulsoryCoverage";
import { RemoveCoverage } from "@shift-replacements/application/use-cases/RemoveCoverage";
import { PrismaShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository";
import { PrismaAbsenceReasonRepository } from "@absence-reasons/infrastructure/persistence/PrismaAbsenceReasonRepository";
import { prismaHasSpecialty } from "@users/infrastructure/persistence/prismaHasSpecialty";
import { getCurrentActor } from "@users/presentation/session";
import { prisma } from "@shared/infrastructure/prisma/client";
import {
  filterConfirmedShiftsForRRHH,
  type RrhhReplacementFilters,
} from "@shift-replacements/presentation/actions/rrhhShiftFilters";

export interface ShiftDto {
  id: string;
  date: string;
  state: string;
  specialtyId: string;
  requesterId: string;
  requesterName?: string;
  moduleHours: number;
  requesterStart: string;
  requesterEnd: string;
  resolvedById: string | null;
  bajoFactura: boolean;
  absenceReasonId: string | null;
  reasonName: string | null;
  observation: string | null;
}

export interface CoverageDto {
  id: string;
  shiftReplacementId: string;
  applicantId: string;
  applicantName?: string;
  start: string;
  end: string;
  origin: string;
}

export interface PostulatedShiftDto extends ShiftDto {
  requesterName: string;
  coverages: CoverageDto[];
}

function mapShiftToDto(s: {
  id: string;
  date: Date;
  state: string;
  specialtyId: string;
  requesterId: string;
  moduleHours: number;
  requesterStart: Date;
  requesterEnd: Date;
  resolvedById: string | null;
  bajoFactura: boolean;
  absenceReasonId: string | null;
  observation?: string | null;
  reasonName?: string | null;
}): ShiftDto {
  return {
    id: s.id,
    date: s.date.toISOString(),
    state: s.state,
    specialtyId: s.specialtyId,
    requesterId: s.requesterId,
    moduleHours: s.moduleHours,
    requesterStart: s.requesterStart.toISOString(),
    requesterEnd: s.requesterEnd.toISOString(),
    resolvedById: s.resolvedById,
    bajoFactura: s.bajoFactura,
    absenceReasonId: s.absenceReasonId,
    observation: s.observation ?? null,
    reasonName: s.reasonName ?? null,
  };
}

export async function requestAbsenceAction(
  input: unknown,
): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = requestAbsenceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const reasons = new PrismaAbsenceReasonRepository();
  const uc = new RequestAbsence(repo, prismaHasSpecialty, reasons);
  const result = await uc.execute({
    requesterId: actor.userId,
    isActive: actor.isActive,
    specialtyId: parsed.data.specialtyId,
    moduleHours: parsed.data.moduleHours,
    requesterStart: parsed.data.requesterStart,
    requesterEnd: parsed.data.requesterEnd,
    absenceReasonId: parsed.data.absenceReasonId,
    observation: parsed.data.observation,
    bajoFactura: parsed.data.bajoFactura,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, data: mapShiftToDto(result.value) };
}

export async function postulateAction(
  input: unknown,
): Promise<ActionResult<CoverageDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = postulateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new PostulateForReplacement(repo, prismaHasSpecialty);
  const result = await uc.execute({
    shiftId: parsed.data.shiftId,
    applicantId: actor.userId,
    isActive: actor.isActive,
    start: parsed.data.start,
    end: parsed.data.end,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const c = result.value;
  return {
    ok: true,
    data: {
      id: c.id,
      shiftReplacementId: c.shiftReplacementId,
      applicantId: c.applicantId,
      start: c.start.toISOString(),
      end: c.end.toISOString(),
      origin: c.origin,
    },
  };
}

export async function resolveRequestAction(
  input: unknown,
): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = resolveRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new ResolveRequest(repo);
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

export async function assignCompulsoryCoverageAction(
  input: unknown,
): Promise<ActionResult<CoverageDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = assignCompulsoryCoverageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new AssignCompulsoryCoverage(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    shiftId: parsed.data.shiftId,
    applicantId: parsed.data.applicantId,
    start: parsed.data.start,
    end: parsed.data.end,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  const c = result.value;
  return {
    ok: true,
    data: {
      id: c.id,
      shiftReplacementId: c.shiftReplacementId,
      applicantId: c.applicantId,
      start: c.start.toISOString(),
      end: c.end.toISOString(),
      origin: c.origin,
    },
  };
}

export async function removeCoverageAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = removeCoverageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const uc = new RemoveCoverage(repo);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    coverageId: parsed.data.coverageId,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

async function resolveRequesterNames(
  shifts: { id: string; requesterId: string }[],
): Promise<Map<string, string>> {
  const requesterIds = [...new Set(shifts.map((s) => s.requesterId))];
  if (requesterIds.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: requesterIds } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

type RepoShift = Parameters<typeof mapShiftToDto>[0] & { requesterId: string };

/** Bulk-resolves absence reason names for a list of reason IDs. */
async function resolveReasonNames(
  shifts: { absenceReasonId: string | null }[],
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(shifts.map((s) => s.absenceReasonId).filter(Boolean) as string[]),
  ];
  if (ids.length === 0) return new Map();
  const rows = await prisma.absenceReason.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(rows.map((r) => [r.id, r.name]));
}

/**
 * Resolves coverages + requester/applicant names for the given shifts and maps
 * them to PostulatedShiftDto. Shared by every action that returns shifts with
 * their coverages (postulated, confirmed, confirmed-by-range, RRHH).
 */
async function toPostulatedDtos<T extends RepoShift>(
  repo: { listCoverages: (shiftId: string) => Promise<CoverageRow[]> },
  shifts: T[],
): Promise<PostulatedShiftDto[]> {
  const result: PostulatedShiftDto[] = [];
  for (const shift of shifts) {
    const coverages = await repo.listCoverages(shift.id);
    const userIds = [shift.requesterId, ...coverages.map((c) => c.applicantId)];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: [...new Set(userIds)] } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    result.push({
      ...mapShiftToDto(shift),
      requesterName: nameById.get(shift.requesterId) ?? shift.requesterId,
      coverages: coverages.map((c) => ({
        id: c.id,
        shiftReplacementId: c.shiftReplacementId,
        applicantId: c.applicantId,
        applicantName: nameById.get(c.applicantId) ?? c.applicantId,
        start: c.start.toISOString(),
        end: c.end.toISOString(),
        origin: c.origin,
      })),
    });
  }
  return result;
}

interface CoverageRow {
  id: string;
  shiftReplacementId: string;
  applicantId: string;
  start: Date;
  end: Date;
  origin: string;
}

export async function listOpenBySpecialtyAction(
  specialtyId: string,
): Promise<ActionResult<ShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listOpenBySpecialty(specialtyId);
  const nameById = await resolveRequesterNames(shifts);

  return {
    ok: true,
    data: shifts.map((s) => ({
      ...mapShiftToDto(s),
      requesterName: nameById.get(s.requesterId) ?? s.requesterId,
    })),
  };
}

export async function listOpenShiftsAction(): Promise<
  ActionResult<ShiftDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.OPEN);
  const nameById = await resolveRequesterNames(shifts);

  return {
    ok: true,
    data: shifts.map((s) => ({
      ...mapShiftToDto(s),
      requesterName: nameById.get(s.requesterId) ?? s.requesterId,
    })),
  };
}

export async function listPostulatedAction(): Promise<
  ActionResult<PostulatedShiftDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR)
    return { ok: false, error: "No autorizado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.OPEN);

  // Only shifts that have at least one coverage
  const shiftsNeedingResolution: PostulatedShiftDto[] = [];
  for (const shift of shifts) {
    const coverages = await repo.listCoverages(shift.id);
    if (coverages.length > 0) {
      const userIds = [
        shift.requesterId,
        ...coverages.map((c) => c.applicantId),
      ];
      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: [...new Set(userIds)] } },
              select: { id: true, name: true },
            })
          : [];
      const nameById = new Map(users.map((u) => [u.id, u.name]));

      shiftsNeedingResolution.push({
        ...mapShiftToDto(shift),
        requesterName: nameById.get(shift.requesterId) ?? shift.requesterId,
        coverages: coverages.map((c) => ({
          id: c.id,
          shiftReplacementId: c.shiftReplacementId,
          applicantId: c.applicantId,
          applicantName: nameById.get(c.applicantId) ?? c.applicantId,
          start: c.start.toISOString(),
          end: c.end.toISOString(),
          origin: c.origin,
        })),
      });
    }
  }

  return { ok: true, data: shiftsNeedingResolution };
}

export async function listConfirmedShiftsAction(): Promise<
  ActionResult<PostulatedShiftDto[]>
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR)
    return { ok: false, error: "No autorizado" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.CONFIRMED);

  const result = await toPostulatedDtos(repo, shifts);

  return { ok: true, data: result };
}

export async function createCompulsoryAction(
  input: unknown,
): Promise<ActionResult<ShiftDto>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };

  const parsed = createCompulsorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const repo = new PrismaShiftReplacementRepository();
  const reasons = new PrismaAbsenceReasonRepository();
  const uc = new CreateCompulsoryReplacement(repo, reasons);
  const result = await uc.execute({
    actorIsCoordinator: actor.role === Role.COORDINATOR,
    coordinatorId: actor.userId,
    specialtyId: parsed.data.specialtyId,
    moduleHours: parsed.data.moduleHours,
    requesterStart: parsed.data.requesterStart,
    requesterEnd: parsed.data.requesterEnd,
    requesterId: parsed.data.requesterId,
    applicantId: parsed.data.applicantId,
    coverageStart: parsed.data.coverageStart,
    coverageEnd: parsed.data.coverageEnd,
    absenceReasonId: parsed.data.absenceReasonId,
    observation: parsed.data.observation,
    bajoFactura: parsed.data.bajoFactura,
  });

  if (!result.isOk) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, data: mapShiftToDto(result.value) };
}

export async function listConfirmedShiftsByDateRangeAction(
  start: string,
  end: string,
): Promise<ActionResult<PostulatedShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.COORDINATOR)
    return { ok: false, error: "No autorizado" };

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    return { ok: false, error: "Fechas inválidas" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.CONFIRMED);

  const filtered = shifts.filter((s) => {
    const shiftStart = s.requesterStart.getTime();
    return shiftStart >= startDate.getTime() && shiftStart <= endDate.getTime();
  });

  const result = await toPostulatedDtos(repo, filtered);

  return { ok: true, data: result };
}

export async function listConfirmedShiftsForRRHHAction(
  filters: RrhhReplacementFilters,
): Promise<ActionResult<PostulatedShiftDto[]>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.RRHH) return { ok: false, error: "No autorizado" };

  const startDate = new Date(filters.start);
  const endDate = new Date(filters.end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    return { ok: false, error: "Fechas inválidas" };

  const repo = new PrismaShiftReplacementRepository();
  const shifts = await repo.listByState(RequestState.CONFIRMED);
  const filtered = filterConfirmedShiftsForRRHH(shifts, filters);

  const reasonNameById = await resolveReasonNames(filtered);
  // `filtered` holds ShiftReplacement CLASS instances whose fields are exposed
  // via getters over a private `props`. Spreading the instance (`...s`) drops
  // those getter-backed values after ESBuild compilation, leaving requesterId /
  // absenceReasonId undefined. Read each field through its getter so the mapped
  // object carries the real values.
  const augmented: RepoShift[] = filtered.map((s) => ({
    id: s.id,
    date: s.date,
    state: s.state,
    specialtyId: s.specialtyId,
    requesterId: s.requesterId,
    moduleHours: s.moduleHours,
    requesterStart: s.requesterStart,
    requesterEnd: s.requesterEnd,
    resolvedById: s.resolvedById,
    bajoFactura: s.bajoFactura,
    absenceReasonId: s.absenceReasonId,
    observation: s.observation,
    reasonName: s.absenceReasonId
      ? (reasonNameById.get(s.absenceReasonId) ?? null)
      : null,
  }));

  const result = await toPostulatedDtos(repo, augmented);

  return { ok: true, data: result };
}

const REGISTERED_STATES = [
  RequestState.OPEN,
  RequestState.POSTULATED,
  RequestState.CONFIRMED,
  RequestState.REJECTED,
] as const;

export async function countRegisteredReplacementsForRRHHAction(
  filters: RrhhReplacementFilters,
): Promise<ActionResult<number>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "No autenticado" };
  if (actor.role !== Role.RRHH) return { ok: false, error: "No autorizado" };

  const startDate = new Date(filters.start);
  const endDate = new Date(filters.end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    return { ok: false, error: "Fechas inválidas" };

  const repo = new PrismaShiftReplacementRepository();
  // "Registered" counts every lifecycle state; the bajoFactura condition only
  // narrows the approved set, so it is intentionally excluded here.
  const registeredFilters: RrhhReplacementFilters = {
    start: filters.start,
    end: filters.end,
    specialtyId: filters.specialtyId,
  };

  let total = 0;
  for (const state of REGISTERED_STATES) {
    const shifts = await repo.listByState(state);
    total += filterConfirmedShiftsForRRHH(shifts, registeredFilters).length;
  }

  return { ok: true, data: total };
}
