import {
  ShiftReplacement as PrismaShiftReplacement,
  ShiftCoverage as PrismaShiftCoverage,
} from "@/generated/prisma/client";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import {
  RequestState,
  isRequestState,
} from "@shift-replacements/domain/enums/RequestState";
import {
  CoverageOrigin,
  isCoverageOrigin,
} from "@shift-replacements/domain/enums/CoverageOrigin";

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
      moduleHours: row.moduleHours,
      requesterStart: row.requesterStart,
      requesterEnd: row.requesterEnd,
      resolvedById: row.resolvedById ?? null,
      absenceReasonId: row.absenceReasonId ?? null,
      observation: row.observation ?? null,
    });
  }
}

export class ShiftCoverageMapper {
  static toDomain(row: PrismaShiftCoverage): ShiftCoverage {
    const origin: CoverageOrigin = isCoverageOrigin(row.origin)
      ? row.origin
      : CoverageOrigin.POSTULATION;

    return ShiftCoverage.fromPersistence({
      id: row.id,
      shiftReplacementId: row.shiftReplacementId,
      applicantId: row.applicantId,
      start: row.start,
      end: row.end,
      origin,
    });
  }
}
