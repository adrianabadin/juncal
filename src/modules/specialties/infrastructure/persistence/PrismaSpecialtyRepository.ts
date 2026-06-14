import { prisma } from "@shared/infrastructure/prisma/client";
import { Specialty } from "@specialties/domain/entities/Specialty";
import { CreateSpecialtyData, SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";
import { SpecialtyMapper } from "@specialties/infrastructure/mappers/SpecialtyMapper";

export class PrismaSpecialtyRepository implements SpecialtyRepository {
  async findById(id: string): Promise<Specialty | null> {
    const row = await prisma.specialty.findUnique({ where: { id } });
    return row ? SpecialtyMapper.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Specialty | null> {
    // SQLite LIKE is case-insensitive for ASCII; retrieve all and compare in JS
    // to match the same semantics as the in-memory repository.
    const rows = await prisma.specialty.findMany({
      where: { name: { contains: name } },
    });
    const match = rows.find(
      (r) => r.name.toLowerCase() === name.toLowerCase()
    );
    return match ? SpecialtyMapper.toDomain(match) : null;
  }

  async create(data: CreateSpecialtyData): Promise<Specialty> {
    const row = await prisma.specialty.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      },
    });
    return SpecialtyMapper.toDomain(row);
  }

  async save(specialty: Specialty): Promise<Specialty> {
    const row = await prisma.specialty.update({
      where: { id: specialty.id },
      data: {
        name: specialty.name,
        description: specialty.description,
        isActive: specialty.isActive,
      },
    });
    return SpecialtyMapper.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.specialty.delete({ where: { id } });
  }

  async list(): Promise<Specialty[]> {
    const rows = await prisma.specialty.findMany();
    return rows.map(SpecialtyMapper.toDomain);
  }
}
