import { prisma } from "@shared/infrastructure/prisma/client";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import {
  CreateCoverageData,
  CreateShiftData,
  ShiftReplacementRepository,
} from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import {
  ShiftReplacementMapper,
  ShiftCoverageMapper,
} from "@shift-replacements/infrastructure/mappers/ShiftReplacementMapper";

export class PrismaShiftReplacementRepository
  implements ShiftReplacementRepository
{
  async findById(id: string): Promise<ShiftReplacement | null> {
    const row = await prisma.shiftReplacement.findUnique({ where: { id } });
    return row ? ShiftReplacementMapper.toDomain(row) : null;
  }

  async create(data: CreateShiftData): Promise<ShiftReplacement> {
    const row = await prisma.shiftReplacement.create({
      data: {
        date: data.date,
        state: data.state,
        requesterId: data.requesterId,
        specialtyId: data.specialtyId,
        moduleHours: data.moduleHours,
        requesterStart: data.requesterStart,
        requesterEnd: data.requesterEnd,
        resolvedById: data.resolvedById ?? null,
        absenceReasonId: data.absenceReasonId ?? null,
        observation: data.observation ?? null,
      },
    });
    return ShiftReplacementMapper.toDomain(row);
  }

  async save(shift: ShiftReplacement): Promise<ShiftReplacement> {
    const row = await prisma.shiftReplacement.update({
      where: { id: shift.id },
      data: {
        state: shift.state,
        resolvedById: shift.resolvedById ?? null,
      },
    });
    return ShiftReplacementMapper.toDomain(row);
  }

  async listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]> {
    const rows = await prisma.shiftReplacement.findMany({
      where: { specialtyId, state: RequestState.OPEN },
      orderBy: { requesterStart: "asc" },
    });
    return rows.map(ShiftReplacementMapper.toDomain);
  }

  async listByState(state: RequestState): Promise<ShiftReplacement[]> {
    const rows = await prisma.shiftReplacement.findMany({
      where: { state },
      orderBy: { requesterStart: "asc" },
    });
    return rows.map(ShiftReplacementMapper.toDomain);
  }

  async addCoverage(data: CreateCoverageData): Promise<ShiftCoverage> {
    const row = await prisma.shiftCoverage.create({
      data: {
        shiftReplacementId: data.shiftReplacementId,
        applicantId: data.applicantId,
        start: data.start,
        end: data.end,
        origin: data.origin,
      },
    });
    return ShiftCoverageMapper.toDomain(row);
  }

  async removeCoverage(coverageId: string): Promise<void> {
    await prisma.shiftCoverage.delete({ where: { id: coverageId } });
  }

  async findCoverageById(coverageId: string): Promise<ShiftCoverage | null> {
    const row = await prisma.shiftCoverage.findUnique({
      where: { id: coverageId },
    });
    return row ? ShiftCoverageMapper.toDomain(row) : null;
  }

  async listCoverages(shiftReplacementId: string): Promise<ShiftCoverage[]> {
    const rows = await prisma.shiftCoverage.findMany({
      where: { shiftReplacementId },
      orderBy: { start: "asc" },
    });
    return rows.map(ShiftCoverageMapper.toDomain);
  }
}
