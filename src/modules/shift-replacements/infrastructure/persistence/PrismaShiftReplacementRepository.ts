import { prisma } from "@shared/infrastructure/prisma/client";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CreateShiftData, ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { ShiftReplacementMapper } from "@shift-replacements/infrastructure/mappers/ShiftReplacementMapper";

export class PrismaShiftReplacementRepository implements ShiftReplacementRepository {
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
        applicantId: data.applicantId ?? null,
        resolvedById: data.resolvedById ?? null,
      },
    });
    return ShiftReplacementMapper.toDomain(row);
  }

  async save(shift: ShiftReplacement): Promise<ShiftReplacement> {
    const row = await prisma.shiftReplacement.update({
      where: { id: shift.id },
      data: {
        state: shift.state,
        applicantId: shift.applicantId ?? null,
        resolvedById: shift.resolvedById ?? null,
      },
    });
    return ShiftReplacementMapper.toDomain(row);
  }

  async listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]> {
    const rows = await prisma.shiftReplacement.findMany({
      where: { specialtyId, state: RequestState.OPEN },
    });
    return rows.map(ShiftReplacementMapper.toDomain);
  }

  async listByState(state: RequestState): Promise<ShiftReplacement[]> {
    const rows = await prisma.shiftReplacement.findMany({
      where: { state },
    });
    return rows.map(ShiftReplacementMapper.toDomain);
  }
}
