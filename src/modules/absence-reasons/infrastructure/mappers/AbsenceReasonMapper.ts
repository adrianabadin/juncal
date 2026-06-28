import { AbsenceReason as PrismaAbsenceReason } from "@/generated/prisma/client";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";

export class AbsenceReasonMapper {
  static toDomain(row: PrismaAbsenceReason): AbsenceReason {
    return AbsenceReason.fromPersistence({
      id: row.id,
      name: row.name,
      isDefault: row.isDefault,
      isActive: row.isActive,
    });
  }
}
