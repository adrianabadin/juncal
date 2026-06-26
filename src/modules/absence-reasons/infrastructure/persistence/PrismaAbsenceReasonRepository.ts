import { prisma } from "@shared/infrastructure/prisma/client";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import {
  AbsenceReasonRepository,
  CreateAbsenceReasonData,
} from "@absence-reasons/domain/ports/AbsenceReasonRepository";
import { AbsenceReasonMapper } from "@absence-reasons/infrastructure/mappers/AbsenceReasonMapper";

export class PrismaAbsenceReasonRepository implements AbsenceReasonRepository {
  async findById(id: string): Promise<AbsenceReason | null> {
    const row = await prisma.absenceReason.findUnique({ where: { id } });
    return row ? AbsenceReasonMapper.toDomain(row) : null;
  }

  async findByName(name: string): Promise<AbsenceReason | null> {
    // SQLite LIKE is case-insensitive for ASCII; retrieve candidates and compare
    // in JS to mirror the in-memory repository semantics.
    const rows = await prisma.absenceReason.findMany({
      where: { name: { contains: name } },
    });
    const match = rows.find((r) => r.name.toLowerCase() === name.toLowerCase());
    return match ? AbsenceReasonMapper.toDomain(match) : null;
  }

  async list(): Promise<AbsenceReason[]> {
    const rows = await prisma.absenceReason.findMany({ orderBy: { name: "asc" } });
    return rows.map(AbsenceReasonMapper.toDomain);
  }

  async listActive(): Promise<AbsenceReason[]> {
    const rows = await prisma.absenceReason.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return rows.map(AbsenceReasonMapper.toDomain);
  }

  async create(data: CreateAbsenceReasonData): Promise<AbsenceReason> {
    const row = await prisma.absenceReason.create({
      data: {
        name: data.name,
        isDefault: data.isDefault ?? false,
        isActive: true,
      },
    });
    return AbsenceReasonMapper.toDomain(row);
  }

  async save(reason: AbsenceReason): Promise<AbsenceReason> {
    const row = await prisma.absenceReason.update({
      where: { id: reason.id },
      data: {
        name: reason.name,
        isActive: reason.isActive,
      },
    });
    return AbsenceReasonMapper.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.absenceReason.delete({ where: { id } });
  }
}
