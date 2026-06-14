import { ShiftReplacement as PrismaShiftReplacement } from "@/generated/prisma/client";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState, isRequestState } from "@shift-replacements/domain/enums/RequestState";

export class ShiftReplacementMapper {
  static toDomain(row: PrismaShiftReplacement): ShiftReplacement {
    const state: RequestState = isRequestState(row.state)
      ? row.state
      : RequestState.OPEN;

    return ShiftReplacement.fromPersistence({
      id: row.id,
      date: row.date,
      state,
      requesterId: row.requesterId,
      specialtyId: row.specialtyId,
      applicantId: row.applicantId ?? null,
      resolvedById: row.resolvedById ?? null,
    });
  }
}
