import { Specialty as PrismaSpecialty } from "@/generated/prisma/client";
import { Specialty } from "@specialties/domain/entities/Specialty";

export class SpecialtyMapper {
  static toDomain(row: PrismaSpecialty): Specialty {
    return Specialty.fromPersistence({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
    });
  }
}
